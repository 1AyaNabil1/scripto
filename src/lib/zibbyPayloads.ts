/**
 * Request bodies for Scripto on Zibby, where model calls go through the
 * platform's `/api/ai` proxy instead of straight to Google.
 *
 * Nothing here imports the App Kit or touches the DOM: the same builders make
 * the real requests in the browser and the `zibby-sample.json` manifest at
 * build time, so the sample an admin prices is the request the app sends.
 *
 * Every builder is pure. A cap-acknowledged retry must resend the
 * byte-identical body (CONTRACT.md §5), so nothing may read a clock or a
 * random value.
 */
import { buildImagePrompt, buildStoryInput, STORYBOARD_SYSTEM_INSTRUCTION } from './prompts';
import { buildStoryboardSchema, toClaudeSchema } from './schema';
import type { ThinkingLevel } from './settings';
import type { VisualStyle } from './styles';
import type { Character, Scene, SceneCountChoice } from './types';

/** Action labels sent as `x-zibby-action`; the platform averages charges per label. */
export const ZIBBY_ACTIONS = { storyboard: 'storyboard', frame: 'frame' } as const;

export interface ZibbyModelOption {
  id: string;
  label: string;
  note: string;
}

/** Platform catalogue ids (CONTRACT.md §2). Every `claude-*` id rides `provider: "anthropic"`. */
export const ZIBBY_TEXT_MODELS: readonly ZibbyModelOption[] = [
  { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', note: 'Default. Careful scenes, fair price.' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5', note: 'Fastest and cheapest.' },
  { id: 'claude-opus-5', label: 'Claude Opus 5', note: 'Most thoughtful, costs the most.' },
];

/** Gemini image models are sold in the OpenAI request format, so they ride `provider: "openai"`. */
export const ZIBBY_IMAGE_MODELS: readonly ZibbyModelOption[] = [
  { id: 'google/gemini-3.1-flash-image', label: 'Gemini 3.1 Flash Image', note: 'Default (Nano Banana 2).' },
  { id: 'google/gemini-2.5-flash-image', label: 'Gemini 2.5 Flash Image', note: 'Cheaper, a little softer.' },
];

export const ZIBBY_DEFAULT_TEXT_MODEL = 'claude-sonnet-5';
export const ZIBBY_DEFAULT_IMAGE_MODEL = 'google/gemini-3.1-flash-image';

/** Placeholder quotes in credits, shown as estimates until the platform sends live averages. */
export const ZIBBY_QUOTES = { storyboard: 6, frame: 9 } as const;

/** Output ceiling for the storyboard. Charges follow the tokens used, not this number. */
export const STORYBOARD_MAX_TOKENS = 16000;

export type JsonObject = Record<string, unknown>;

/** Haiku 4.5 rejects `effort`; the 5-series models accept low, medium and high. */
function effortFor(model: string, level: ThinkingLevel): string | undefined {
  if (model.startsWith('claude-haiku-4')) return undefined;
  return level === 'low' || level === 'medium' || level === 'high' ? level : undefined;
}

/** Anthropic Messages body with JSON Schema structured output. */
export function buildClaudeStoryboardPayload(params: {
  story: string;
  sceneCount: SceneCountChoice;
  style: VisualStyle;
  model: string;
  thinkingLevel: ThinkingLevel;
}): JsonObject {
  const effort = effortFor(params.model, params.thinkingLevel);
  return {
    model: params.model,
    max_tokens: STORYBOARD_MAX_TOKENS,
    system: STORYBOARD_SYSTEM_INSTRUCTION,
    messages: [{ role: 'user', content: buildStoryInput(params.story, params.sceneCount, params.style) }],
    output_config: {
      format: { type: 'json_schema', schema: toClaudeSchema(buildStoryboardSchema(params.sceneCount)) },
      ...(effort ? { effort } : {}),
    },
  };
}

/**
 * OpenAI-format body for a Gemini image model. `image_config.aspect_ratio`
 * asks for a 16:9 frame; the prompt says so too, in case a route ignores it.
 */
export function buildZibbyImagePayload(params: {
  prompt: string;
  model: string;
  reference?: { mimeType: string; data: string } | undefined;
}): JsonObject {
  const content: JsonObject[] = [{ type: 'text', text: params.prompt }];
  if (params.reference) {
    content.push({
      type: 'image_url',
      image_url: { url: `data:${params.reference.mimeType};base64,${params.reference.data}` },
    });
  }
  return {
    model: params.model,
    modalities: ['image', 'text'],
    messages: [{ role: 'user', content }],
    image_config: { aspect_ratio: '16:9' },
  };
}

/** The sample requests Zibby replays to price the app (`zibby-sample.json`). */
export function buildZibbySample(style: VisualStyle) {
  const story =
    'Every night, old Ilyas opens his tiny clock stall at the edge of the lantern market. One rainy evening a girl named Noor brings him a silent music box that belonged to her grandmother.';
  const cast: Character[] = [
    { name: 'Ilyas', appearance: 'an elderly clockmaker with a neat white beard and round brass-rimmed glasses' },
  ];
  const scene: Scene = {
    id: 'sample',
    title: 'The lantern market',
    slugline: 'EXT. LANTERN MARKET — NIGHT',
    description: 'Rain falls on a crowded night market. At its edge, Ilyas opens the shutters of his clock stall.',
    characters: ['Ilyas'],
    setting: 'A narrow night market strung with paper lanterns, light rain, evening',
    mood: 'calm',
    intensity: 1,
    shot: 'establishing',
    lineType: 'narration',
    speaker: '',
    line: 'Every night, the clocks of Lantern Street started ticking before the lanterns were lit.',
    visualPrompt: 'A narrow street market at night lined with glowing paper lanterns; at the far end a tiny clock stall.',
  };
  return {
    version: 1 as const,
    requests: [
      {
        action: ZIBBY_ACTIONS.storyboard,
        provider: 'anthropic',
        model: ZIBBY_DEFAULT_TEXT_MODEL,
        payload: buildClaudeStoryboardPayload({ story, sceneCount: 4, style, model: ZIBBY_DEFAULT_TEXT_MODEL, thinkingLevel: 'low' }),
      },
      {
        action: ZIBBY_ACTIONS.frame,
        provider: 'openai',
        model: ZIBBY_DEFAULT_IMAGE_MODEL,
        payload: buildZibbyImagePayload({
          prompt: buildImagePrompt({ scene, index: 0, total: 4, cast, style, hasReference: false }),
          model: ZIBBY_DEFAULT_IMAGE_MODEL,
        }),
      },
    ],
  };
}
