/**
 * Turns the model's JSON (or an imported file) into a clean storyboard.
 *
 * Structured output makes well-formed JSON likely, not certain: models can
 * wrap it in code fences, drift from enums, or return too few scenes. Fixable
 * problems are repaired and reported as warnings; unusable output throws a
 * ScriptoError with a clear message.
 */
import { ScriptoError } from './errors';
import { makeId } from './ids';
import { MAX_SCENES, type Character, type LineType, type Scene } from './types';
import { normalizeMood, normalizeShot } from './vocabulary';

export interface ParsedStoryboard {
  title: string;
  logline: string;
  language: string;
  characters: Character[];
  scenes: Scene[];
  warnings: string[];
}

const LIMITS = {
  title: 120,
  logline: 400,
  description: 800,
  setting: 240,
  speaker: 80,
  line: 400,
  visualPrompt: 1000,
  characterName: 60,
  appearance: 400,
  charactersPerScene: 8,
  cast: 12,
} as const;

type Json = Record<string, unknown>;

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function text(value: unknown, max: number): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return '';
  const clean = value
    .replace(/\r\n?/g, '\n')
    // eslint-disable-next-line no-control-regex -- strip control characters the model may emit
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function nameList(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(/[,،;\n]/)
      : [];
  const seen = new Set<string>();
  const names: string[] = [];
  for (const item of raw) {
    const name = text(isObject(item) ? item.name : item, LIMITS.characterName);
    const key = name.toLowerCase();
    if (name && !seen.has(key)) {
      seen.add(key);
      names.push(name);
    }
  }
  return names.slice(0, LIMITS.charactersPerScene);
}

function intensity(value: unknown): number | undefined {
  const n = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n)) return undefined;
  return Math.min(5, Math.max(1, Math.round(n)));
}

const LANGUAGE_TAG = /^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i;

/** Removes ```json fences and any chatter around the JSON value. */
export function extractJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^\uFEFF/, '');
  if (!trimmed) throw new ScriptoError('bad-response', 'The model returned an empty answer. Please try again.');
  const candidates = [trimmed];
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const start = trimmed.search(/[[{]/);
  const end = Math.max(trimmed.lastIndexOf('}'), trimmed.lastIndexOf(']'));
  if (start >= 0 && end > start) candidates.push(trimmed.slice(start, end + 1));
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      // try the next candidate
    }
  }
  throw new ScriptoError(
    'parse',
    'The model’s answer was not valid JSON, so Scripto could not build the storyboard. Try again; if it keeps happening, choose another text model in Settings.',
    { detail: `Answer began with: ${trimmed.slice(0, 80)}` },
  );
}

export function normalizeScene(value: unknown, index: number): { scene?: Scene; problems: string[] } {
  const problems: string[] = [];
  if (!isObject(value)) return { problems: [`Scene ${index + 1} was not an object and was skipped.`] };

  const description = text(value.description ?? value.summary ?? value.action, LIMITS.description);
  const visualPrompt = text(value.visualPrompt ?? value.visual_prompt ?? value.imagePrompt, LIMITS.visualPrompt);
  if (!description && !visualPrompt) {
    return { problems: [`Scene ${index + 1} had no description and was skipped.`] };
  }

  const mood = normalizeMood(value.mood);
  if (!mood) problems.push(`Scene ${index + 1}: unknown mood "${text(value.mood, 30)}", using "calm".`);
  const shot = normalizeShot(value.shot ?? value.camera ?? value.cameraShot);
  if (!shot) problems.push(`Scene ${index + 1}: unknown camera shot, using "medium".`);

  const speaker = text(value.speaker, LIMITS.speaker);
  const line = text(value.line ?? value.dialogue ?? value.narration, LIMITS.line);
  let lineType: LineType =
    value.lineType === 'dialogue' || value.lineType === 'narration'
      ? value.lineType
      : speaker
        ? 'dialogue'
        : 'narration';
  if (lineType === 'dialogue' && !speaker) lineType = 'narration';

  return {
    scene: {
      id: makeId('scene'),
      title: text(value.title, LIMITS.title) || `Scene ${index + 1}`,
      description,
      characters: nameList(value.characters),
      setting: text(value.setting ?? value.location, LIMITS.setting),
      mood: mood ?? 'calm',
      intensity: intensity(value.intensity) ?? 3,
      shot: shot ?? 'medium',
      lineType,
      speaker: lineType === 'narration' ? '' : speaker,
      line,
      visualPrompt,
    },
    problems,
  };
}

function normalizeCast(value: unknown): Character[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const cast: Character[] = [];
  for (const item of value) {
    if (!isObject(item)) continue;
    const name = text(item.name, LIMITS.characterName);
    const appearance = text(item.appearance ?? item.description ?? item.look, LIMITS.appearance);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    cast.push({ name, appearance });
  }
  return cast.slice(0, LIMITS.cast);
}

/** Validates and repairs storyboard data from the model or a file. */
export function normalizeStoryboardData(
  data: unknown,
  options: { expected?: { min: number; max: number } } = {},
): ParsedStoryboard {
  const root: Json = Array.isArray(data) ? { scenes: data } : isObject(data) ? data : {};
  const rawScenes: unknown = root.scenes ?? root.frames;
  if (!Array.isArray(rawScenes) || rawScenes.length === 0) {
    throw new ScriptoError(
      'validation',
      'The model’s answer did not contain any scenes. Try again, or make the story a little longer.',
    );
  }

  const warnings: string[] = [];
  const scenes: Scene[] = [];
  rawScenes.forEach((raw, i) => {
    const { scene, problems } = normalizeScene(raw, i);
    warnings.push(...problems);
    if (scene) scenes.push(scene);
  });

  if (scenes.length === 0) {
    throw new ScriptoError('validation', 'None of the scenes in the model’s answer could be used. Please try again.');
  }
  if (scenes.length > MAX_SCENES) {
    warnings.push(`The model returned ${scenes.length} scenes; keeping the first ${MAX_SCENES}.`);
    scenes.length = MAX_SCENES;
  }
  const expected = options.expected;
  if (expected && (scenes.length < expected.min || scenes.length > expected.max)) {
    const asked = expected.min === expected.max ? `${expected.min}` : `${expected.min}–${expected.max}`;
    warnings.push(`Asked for ${asked} scenes and got ${scenes.length}.`);
  }

  const language = text(root.language, 20);
  return {
    title: text(root.title, LIMITS.title) || 'Untitled storyboard',
    logline: text(root.logline, LIMITS.logline),
    language: LANGUAGE_TAG.test(language) ? language : 'und',
    characters: normalizeCast(root.characters),
    scenes,
    warnings,
  };
}

/** Parses the text model's answer into a storyboard draft. */
export function parseStoryboardText(
  raw: string,
  options: { expected?: { min: number; max: number } } = {},
): ParsedStoryboard {
  return normalizeStoryboardData(extractJson(raw), options);
}
