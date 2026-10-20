/** Story → storyboard → frames, on top of either backend (your own Gemini key, or Zibby). */
import { createGeminiBackend, type AiBackend, type CallContext } from './backend';
import { redact, ScriptoError, type ErrorKind } from './errors';
import { resolveDirection } from './direction';
import { fromDataUrl, toDataUrl, type ExtractedImage } from './gemini';
import { makeId } from './ids';
import { buildImagePrompt } from './prompts';
import { sceneRange } from './schema';
import type { Settings } from './settings';
import { getStyle } from './styles';
import {
  MAX_STORY_CHARS,
  MIN_STORY_CHARS,
  type SceneCountChoice,
  type SceneImage,
  type Storyboard,
} from './types';
import { parseStoryboardText } from './validate';

interface ApiAccess extends Omit<CallContext, 'capAck'> {
  /** Where requests go. Defaults to Gemini with `apiKey`. */
  backend?: AiBackend | undefined;
  apiKey?: string;
  fetchImpl?: typeof fetch;
  /** Resend past Zibby's spending cap: applies to the first request only. */
  capAck?: boolean | undefined;
}

function backendFor(access: ApiAccess): AiBackend {
  return access.backend ?? createGeminiBackend({ apiKey: access.apiKey ?? '', fetchImpl: access.fetchImpl });
}

export function validateStoryInput(story: string): void {
  const length = story.trim().length;
  if (length < MIN_STORY_CHARS) {
    throw new ScriptoError(
      'input',
      `Write a little more: Scripto needs at least ${MIN_STORY_CHARS} characters to find scenes in a story.`,
    );
  }
  if (length > MAX_STORY_CHARS) {
    throw new ScriptoError(
      'input',
      `This story is ${length.toLocaleString()} characters long. Scripto works best with short stories; please keep it under ${MAX_STORY_CHARS.toLocaleString()} characters.`,
    );
  }
}

export async function generateStoryboard(
  params: ApiAccess & { story: string; sceneCount: SceneCountChoice; styleId: string; settings: Settings },
): Promise<{ storyboard: Storyboard; warnings: string[] }> {
  validateStoryInput(params.story);
  const style = getStyle(params.styleId);
  const backend = backendFor(params);
  const { text: answer } = await backend.writeStoryboard({
    story: params.story,
    sceneCount: params.sceneCount,
    style,
    settings: params.settings,
    signal: params.signal,
    capAck: params.capAck,
    onCharge: params.onCharge,
  });
  if (!answer.trim()) {
    throw new ScriptoError(
      'bad-response',
      'The model returned no text. This can happen when a story trips the safety filters; try rewording it, or try again.',
    );
  }
  const parsed = parseStoryboardText(answer, { expected: sceneRange(params.sceneCount) });
  const storyboard: Storyboard = {
    version: 1,
    id: makeId('sb'),
    title: parsed.title,
    logline: parsed.logline,
    language: parsed.language,
    direction: resolveDirection(params.story, parsed.language),
    styleId: style.id,
    characters: parsed.characters,
    scenes: parsed.scenes,
    source: backend.kind,
    createdAt: new Date().toISOString(),
    story: params.story.trim(),
  };
  return { storyboard, warnings: parsed.warnings };
}

export async function generateFrame(
  params: ApiAccess & {
    storyboard: Storyboard;
    sceneId: string;
    settings: Settings;
    reference?: ExtractedImage | undefined;
  },
): Promise<SceneImage> {
  const { storyboard } = params;
  const index = storyboard.scenes.findIndex((s) => s.id === params.sceneId);
  const scene = storyboard.scenes[index];
  if (!scene) throw new ScriptoError('input', 'That scene no longer exists.');
  const prompt = buildImagePrompt({
    scene,
    index,
    total: storyboard.scenes.length,
    cast: storyboard.characters,
    style: getStyle(storyboard.styleId),
    hasReference: Boolean(params.reference),
  });
  const { image, text } = await backendFor(params).drawFrame({
    prompt,
    reference: params.reference,
    settings: params.settings,
    signal: params.signal,
    capAck: params.capAck,
    onCharge: params.onCharge,
  });
  if (!image) {
    const said = text.trim();
    throw new ScriptoError(
      'no-image',
      'The image model did not return a picture for this scene. It may have been held back by safety filters; try editing the scene and regenerating.',
      { detail: said ? redact(said, params.apiKey ? [params.apiKey] : []) : undefined },
    );
  }
  return {
    src: toDataUrl(image),
    mimeType: image.mimeType,
    model: params.settings.imageModel,
    createdAt: new Date().toISOString(),
  };
}

/** Errors that will fail every remaining frame the same way. */
const FATAL_KINDS: ReadonlySet<ErrorKind> = new Set([
  'missing-key',
  'invalid-key',
  'permission',
  'quota',
  'model-not-found',
  'aborted',
  'credits',
  'cap',
  'signed-out',
  'locked',
]);

export function isFatalForBatch(error: unknown): boolean {
  return error instanceof ScriptoError && FATAL_KINDS.has(error.kind);
}

export interface FrameBatchCallbacks {
  onStart?: (sceneId: string) => void;
  onDone?: (sceneId: string, image: SceneImage) => void;
  onError?: (sceneId: string, error: unknown) => void;
  /** Called for frames that were never attempted because the batch stopped. */
  onSkip?: (sceneId: string) => void;
}

export interface FrameBatchResult {
  done: number;
  failed: number;
  skipped: number;
  /** The error that stopped the batch early, if any. */
  fatal?: unknown;
}

/**
 * Generates frames for the given scenes. With style references on, the first
 * frame is made alone and then attached to the others to keep the look
 * consistent; the rest run with limited concurrency.
 */
export async function generateFrames(
  params: ApiAccess &
    FrameBatchCallbacks & {
      storyboard: Storyboard;
      sceneIds: readonly string[];
      settings: Settings;
      concurrency?: number;
    },
): Promise<FrameBatchResult> {
  const queue = [...params.sceneIds];
  const result: FrameBatchResult = { done: 0, failed: 0, skipped: 0 };
  let stopped = false;

  const existingReference = params.settings.useStyleReference
    ? params.storyboard.scenes
        .filter((s) => s.image && !params.sceneIds.includes(s.id))
        .map((s) => (s.image ? fromDataUrl(s.image.src) : undefined))
        .find(Boolean)
    : undefined;
  let reference: ExtractedImage | undefined = existingReference;
  let capAck = params.capAck ?? false;

  const runOne = async (sceneId: string): Promise<void> => {
    if (stopped || params.signal?.aborted) {
      result.skipped += 1;
      params.onSkip?.(sceneId);
      return;
    }
    params.onStart?.(sceneId);
    const ack = capAck;
    capAck = false;
    try {
      const image = await generateFrame({ ...params, sceneId, reference, capAck: ack });
      result.done += 1;
      params.onDone?.(sceneId, image);
      if (params.settings.useStyleReference && !reference) reference = fromDataUrl(image.src);
    } catch (error) {
      result.failed += 1;
      params.onError?.(sceneId, error);
      if (isFatalForBatch(error)) {
        stopped = true;
        result.fatal ??= error;
      }
    }
  };

  if (params.settings.useStyleReference && !reference && queue.length > 1) {
    const first = queue.shift();
    if (first) await runOne(first);
  }

  const workers = Array.from({ length: Math.max(1, Math.min(params.concurrency ?? 2, queue.length)) }, async () => {
    for (let next = queue.shift(); next !== undefined; next = queue.shift()) {
      await runOne(next);
    }
  });
  await Promise.all(workers);
  return result;
}
