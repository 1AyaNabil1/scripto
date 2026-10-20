/**
 * The ways Scripto reaches the models, behind one interface: Scripto's own
 * scene writer on the free site (siteApi.ts), Zibby's proxy paid in the
 * visitor's credits (zibby.ts), and Gemini itself, which only the scene
 * writer's server calls with the key it holds.
 */
import { createInteraction, extractImage, extractText, type ExtractedImage } from './gemini';
import { buildImageRequest, buildStoryboardRequest } from './prompts';
import type { Settings } from './settings';
import type { VisualStyle } from './styles';
import type { SceneCountChoice } from './types';

/** What one Zibby run cost. The only figure that matches Zibby's ledger. */
export interface Charge {
  /** False when the stream ended without the charge frame: show "charge unknown" and the request id. */
  known: boolean;
  credits: number;
  /** The visitor's runs are on Zibby: show no price at all. */
  comped: boolean;
  requestId: string | null;
}

export interface CallContext {
  signal?: AbortSignal | undefined;
  /** The visitor agreed to continue past Zibby's spending cap; resend with the cap acknowledged. */
  capAck?: boolean | undefined;
  /** Called as soon as a run's charge is known, even if the answer then turns out unusable. */
  onCharge?: ((charge: Charge) => void) | undefined;
}

export interface StoryboardCall extends CallContext {
  story: string;
  sceneCount: SceneCountChoice;
  style: VisualStyle;
  settings: Settings;
}

export interface FrameCall extends CallContext {
  prompt: string;
  reference?: ExtractedImage | undefined;
  settings: Settings;
}

export interface AiBackend {
  readonly kind: 'gemini' | 'zibby';
  /** Returns the model's raw answer; validation happens in generate.ts. */
  writeStoryboard(call: StoryboardCall): Promise<{ text: string }>;
  drawFrame(call: FrameCall): Promise<{ image: ExtractedImage | undefined; text: string }>;
}

/** Calls the Gemini Interactions API with a key. Server-side only: keys never reach the browser. */
export function createGeminiBackend(options: {
  apiKey: string;
  fetchImpl?: typeof fetch | undefined;
  timeoutMs?: number | undefined;
}): AiBackend {
  const access = (purpose: 'text' | 'image', signal: AbortSignal | undefined) => ({
    apiKey: options.apiKey,
    purpose,
    signal,
    ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
    ...(options.timeoutMs ? { timeoutMs: options.timeoutMs } : {}),
  });
  return {
    kind: 'gemini',
    async writeStoryboard(call) {
      const request = buildStoryboardRequest({
        story: call.story,
        sceneCount: call.sceneCount,
        style: call.style,
        model: call.settings.textModel,
        thinkingLevel: call.settings.thinkingLevel,
      });
      const interaction = await createInteraction(request, access('text', call.signal));
      return { text: extractText(interaction) };
    },
    async drawFrame(call) {
      const request = buildImageRequest({
        prompt: call.prompt,
        model: call.settings.imageModel,
        imageSize: call.settings.imageSize,
        reference: call.reference,
      });
      const interaction = await createInteraction(request, access('image', call.signal));
      return { image: extractImage(interaction), text: extractText(interaction) };
    },
  };
}
