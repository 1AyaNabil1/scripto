/**
 * User settings, kept in this browser's localStorage only.
 *
 * The API key lives under its own storage key so that "Forget key" removes
 * exactly that and nothing else. Nothing here is ever sent anywhere except
 * the key itself, which goes only to Google's Generative Language API.
 *
 * On Zibby there is no key, and the model choices are the platform's
 * catalogue ids instead of Gemini model names.
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

export interface ModelOption {
  id: string;
  note: string;
}

/**
 * Model IDs checked against https://ai.google.dev/gemini-api/docs/models,
 * .../thinking and .../image-generation (October 2026).
 */
export const TEXT_MODEL_OPTIONS: readonly ModelOption[] = [
  { id: 'gemini-3.8-flash', note: 'Default. Stable, free tier available.' },
  { id: 'gemini-3.5-flash-lite', note: 'Faster and cheaper. Stable, free tier available.' },
  { id: 'gemini-3.1-flash-lite', note: 'Lowest cost. Stable, free tier available.' },
  { id: 'gemini-3.1-pro-preview', note: 'Strongest reasoning. Preview, paid.' },
];

export const IMAGE_MODEL_OPTIONS: readonly ModelOption[] = [
  { id: 'gemini-3.1-flash-image', note: 'Default (Nano Banana 2). Good character consistency. Paid tier.' },
  { id: 'gemini-3.1-flash-lite-image', note: 'Fastest and cheapest (Nano Banana 2 Lite). 1K only. Paid tier.' },
  { id: 'gemini-3-pro-image', note: 'Highest quality (Nano Banana Pro). Most expensive. Paid tier.' },
];

export interface Settings {
  textModel: string;
  imageModel: string;
  thinkingLevel: ThinkingLevel;
  generateImages: boolean;
  imageSize: ImageSize;
  /** Send the first finished frame along with later prompts as a style reference. */
  useStyleReference: boolean;
}

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  textModel: 'gemini-3.8-flash',
  imageModel: 'gemini-3.1-flash-image',
  thinkingLevel: 'low',
  generateImages: false, // image models need a paid-tier key; text works on the free tier
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

export function defaultSettings(host: Host = 'byok'): Settings {
  return { ...(host === 'zibby' ? ZIBBY_DEFAULT_SETTINGS : DEFAULT_SETTINGS) };
}

export const STORAGE_KEYS = {
  apiKey: 'scripto.apiKey',
  settings: 'scripto.settings',
  storyboard: 'scripto.storyboard',
  theme: 'scripto.theme',
  draft: 'scripto.draft',
} as const;

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

export function sanitizeSettings(raw: unknown, host: Host = 'byok'): Settings {
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

export function loadSettings(storage: Storage | null = safeStorage(), host: Host = 'byok'): Settings {
  if (!storage) return defaultSettings(host);
  try {
    const raw = storage.getItem(STORAGE_KEYS.settings);
    return sanitizeSettings(raw ? JSON.parse(raw) : {}, host);
  } catch {
    return defaultSettings(host);
  }
}

export function saveSettings(settings: Settings, storage: Storage | null = safeStorage(), host: Host = 'byok'): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEYS.settings, JSON.stringify(sanitizeSettings(settings, host)));
    return true;
  } catch {
    return false;
  }
}

/** Gemini keys are opaque tokens; accept anything printable without spaces. */
export function normalizeApiKey(value: string): string {
  return value.trim();
}

export function looksLikeApiKey(value: string): boolean {
  const key = normalizeApiKey(value);
  return key.length >= 20 && key.length <= 256 && /^[\x21-\x7e]+$/.test(key);
}

export function loadApiKey(storage: Storage | null = safeStorage()): string {
  if (!storage) return '';
  try {
    return storage.getItem(STORAGE_KEYS.apiKey) ?? '';
  } catch {
    return '';
  }
}

export function saveApiKey(key: string, storage: Storage | null = safeStorage()): boolean {
  if (!storage) return false;
  const normalized = normalizeApiKey(key);
  try {
    if (normalized) storage.setItem(STORAGE_KEYS.apiKey, normalized);
    else storage.removeItem(STORAGE_KEYS.apiKey);
    return true;
  } catch {
    return false;
  }
}

/** Removes the stored key. Settings and storyboards are left alone. */
export function forgetApiKey(storage: Storage | null = safeStorage()): void {
  try {
    storage?.removeItem(STORAGE_KEYS.apiKey);
  } catch {
    // nothing else to do: the key cannot have been stored either
  }
}

/** Shows only the last four characters, e.g. "••••••••3xQz". */
export function maskApiKey(key: string): string {
  if (!key) return '';
  const tail = key.slice(-4);
  return `${'•'.repeat(8)}${tail}`;
}
