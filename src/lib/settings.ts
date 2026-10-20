/**
 * User settings, kept in this browser's localStorage only. Nothing here is
 * ever sent anywhere.
 *
 * Only Scripto on Zibby has choices to make (models, frames); the free site
 * keeps its defaults, and its scene writer picks the model on the server. No
 * build stores an API key any more: the free site removes one an earlier
 * version may have left behind.
 */
import type { Host } from './host';
import {
  ZIBBY_DEFAULT_IMAGE_MODEL,
  ZIBBY_DEFAULT_TEXT_MODEL,
  ZIBBY_IMAGE_MODELS,
  ZIBBY_TEXT_MODELS,
} from './zibbyPayloads';

export const THINKING_LEVELS = ['default', 'minimal', 'low', 'medium', 'high'] as const;
export type ThinkingLevel = (typeof THINKING_LEVELS)[number];

export const IMAGE_SIZES = ['1K', '2K'] as const;
export type ImageSize = (typeof IMAGE_SIZES)[number];

export interface Settings {
  textModel: string;
  imageModel: string;
  thinkingLevel: ThinkingLevel;
  generateImages: boolean;
  imageSize: ImageSize;
  /** Send the first finished frame along with later prompts as a style reference. */
  useStyleReference: boolean;
}

/**
 * The free site. The text model is what the scene writer uses unless its
 * GEMINI_MODEL says otherwise (checked against
 * https://ai.google.dev/gemini-api/docs/models, October 2026: free tier
 * available). Frames need a paid image model, so they stay off.
 */
export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  textModel: 'gemini-3.8-flash',
  imageModel: 'gemini-3.1-flash-image',
  thinkingLevel: 'low',
  generateImages: false,
  imageSize: '1K',
  useStyleReference: true,
});

/** On Zibby frames are paid in credits, so they start on. */
export const ZIBBY_DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  textModel: ZIBBY_DEFAULT_TEXT_MODEL,
  imageModel: ZIBBY_DEFAULT_IMAGE_MODEL,
  thinkingLevel: 'low',
  generateImages: true,
  imageSize: '1K',
  useStyleReference: true,
});

export function defaultSettings(host: Host = 'site'): Settings {
  return { ...(host === 'zibby' ? ZIBBY_DEFAULT_SETTINGS : DEFAULT_SETTINGS) };
}

export const STORAGE_KEYS = {
  settings: 'scripto.settings',
  storyboard: 'scripto.storyboard',
  theme: 'scripto.theme',
  draft: 'scripto.draft',
} as const;

/** Where the old bring-your-own-key version kept a visitor's Gemini key. */
export const LEGACY_KEY_ENTRY = 'scripto.apiKey';

/** Model IDs are short tokens such as "gemini-3.8-flash"; reject anything else. */
const MODEL_ID_PATTERN = /^[a-z0-9][a-z0-9.\-_]{1,79}$/i;

export function isValidModelId(value: unknown): value is string {
  return typeof value === 'string' && MODEL_ID_PATTERN.test(value.trim());
}

export function safeStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null; // storage disabled (e.g. strict privacy settings)
  }
}

export function sanitizeSettings(raw: unknown, host: Host = 'site'): Settings {
  const input = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const defaults = host === 'zibby' ? ZIBBY_DEFAULT_SETTINGS : DEFAULT_SETTINGS;
  const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
    typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
  const model = (value: unknown, catalogue: readonly { id: string }[], fallback: string): string =>
    host === 'zibby'
      ? pick(value, catalogue.map((option) => option.id), fallback)
      : isValidModelId(value)
        ? value.trim()
        : fallback;
  return {
    textModel: model(input.textModel, ZIBBY_TEXT_MODELS, defaults.textModel),
    imageModel: model(input.imageModel, ZIBBY_IMAGE_MODELS, defaults.imageModel),
    thinkingLevel: pick(input.thinkingLevel, THINKING_LEVELS, defaults.thinkingLevel),
    generateImages: typeof input.generateImages === 'boolean' ? input.generateImages : defaults.generateImages,
    imageSize: pick(input.imageSize, IMAGE_SIZES, defaults.imageSize),
    useStyleReference:
      typeof input.useStyleReference === 'boolean' ? input.useStyleReference : defaults.useStyleReference,
  };
}

export function loadSettings(storage: Storage | null = safeStorage(), host: Host = 'site'): Settings {
  if (!storage) return defaultSettings(host);
  try {
    const raw = storage.getItem(STORAGE_KEYS.settings);
    return sanitizeSettings(raw ? JSON.parse(raw) : {}, host);
  } catch {
    return defaultSettings(host);
  }
}

export function saveSettings(settings: Settings, storage: Storage | null = safeStorage(), host: Host = 'site'): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEYS.settings, JSON.stringify(sanitizeSettings(settings, host)));
    return true;
  } catch {
    return false;
  }
}

/** Removes a key the old own-key version stored. Settings and storyboards are left alone. */
export function forgetLegacyKey(storage: Storage | null = safeStorage()): void {
  try {
    storage?.removeItem(LEGACY_KEY_ENTRY);
  } catch {
    // nothing else to do: the key cannot have been stored either
  }
}
