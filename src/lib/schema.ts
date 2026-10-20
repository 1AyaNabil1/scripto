import { LINE_TYPES, MAX_SCENES, MIN_SCENES, MOODS, SHOTS, type SceneCountChoice } from './types';

/** Scene range the model may choose from when the user picks "Auto". */
export const AUTO_SCENE_RANGE = { min: 4, max: 8 } as const;

export function sceneRange(choice: SceneCountChoice): { min: number; max: number } {
  if (choice === 'auto') return { ...AUTO_SCENE_RANGE };
  const n = Math.min(MAX_SCENES, Math.max(MIN_SCENES, Math.round(choice)));
  return { min: n, max: n };
}

const SCENE_FIELDS = [
  'title',
  'slugline',
  'description',
  'setting',
  'characters',
  'mood',
  'intensity',
  'shot',
  'lineType',
  'speaker',
  'line',
  'visualPrompt',
] as const;

/**
 * JSON Schema for the storyboard the text model must return. It uses only the
 * subset the Gemini API documents for structured output (type, properties,
 * required, enum, items, minItems/maxItems, minimum/maximum, description).
 * Property order matters: the model generates fields in this order.
 */
export function buildStoryboardSchema(choice: SceneCountChoice) {
  const { min, max } = sceneRange(choice);
  return {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description: 'Short storyboard title, in the language of the story.',
      },
      logline: {
        type: 'string',
        description: 'One-sentence summary of the story, in the language of the story.',
      },
      language: {
        type: 'string',
        description: 'BCP 47 code of the language the story is written in, e.g. "en", "ar", "fr".',
      },
      characters: {
        type: 'array',
        description: 'Main characters, so frames can draw them consistently.',
        maxItems: 8,
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Name as used in the scenes.' },
            appearance: {
              type: 'string',
              description:
                'Concrete visual description in English: age, build, hair, clothing, colours, distinctive features.',
            },
          },
          required: ['name', 'appearance'],
          additionalProperties: false,
        },
      },
      scenes: {
        type: 'array',
        minItems: min,
        maxItems: max,
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Scene title of a few words, in the language of the story.' },
            slugline: {
              type: 'string',
              description:
                'Screenplay scene heading in the language of the story: interior or exterior, place, time of day. For example "EXT. NIGHT MARKET — NIGHT" or "خارجي. الشاطئ — صباح".',
            },
            description: {
              type: 'string',
              description: 'One or two sentences on what happens in this moment, in the language of the story.',
            },
            setting: {
              type: 'string',
              description: 'Where and when: place, time of day, weather. In the language of the story.',
            },
            characters: {
              type: 'array',
              description: 'Names of the characters visible in the frame. Empty if none.',
              items: { type: 'string' },
            },
            mood: { type: 'string', enum: [...MOODS], description: 'Closest overall mood of the scene.' },
            intensity: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Emotional intensity: 1 is quiet, 5 is the emotional peak.',
            },
            shot: { type: 'string', enum: [...SHOTS], description: 'Camera shot for the frame.' },
            lineType: {
              type: 'string',
              enum: [...LINE_TYPES],
              description: '"dialogue" when a character speaks, otherwise "narration".',
            },
            speaker: { type: 'string', description: 'Who speaks the line. Empty string for narration.' },
            line: {
              type: 'string',
              description: 'One line of dialogue or narration under 25 words, in the language of the story.',
            },
            visualPrompt: {
              type: 'string',
              description:
                'In English, one to three sentences describing only what the camera sees: subjects, action, composition, lighting. No text or captions.',
            },
          },
          required: [...SCENE_FIELDS],
          additionalProperties: false,
        },
      },
    },
    required: ['title', 'logline', 'language', 'characters', 'scenes'],
    additionalProperties: false,
  } as const;
}

export type StoryboardSchema = ReturnType<typeof buildStoryboardSchema>;

/** Keywords Claude's structured output accepts. Numeric and array-length limits are not among them. */
const CLAUDE_SCHEMA_KEYWORDS = new Set(['type', 'properties', 'required', 'additionalProperties', 'enum', 'items', 'description']);

/**
 * The same schema for Claude's `output_config.format`: everything it does not
 * support (minimum/maximum, minItems/maxItems) is dropped. Those limits are
 * still enforced after the answer arrives, by `normalizeStoryboardData`.
 */
export function toClaudeSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toClaudeSchema);
  if (!node || typeof node !== 'object') return node;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key === 'properties' && value && typeof value === 'object') {
      out[key] = Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([name, child]) => [name, toClaudeSchema(child)]));
    } else if (CLAUDE_SCHEMA_KEYWORDS.has(key)) {
      out[key] = toClaudeSchema(value);
    }
  }
  return out;
}
