/**
 * User settings, kept in this browser's localStorage only.
 *
 * The API key lives under its own storage key so that "Forget key" removes
 * exactly that and nothing else. Nothing here is ever sent anywhere except
 * the key itself, which goes only to Google's Generative Language API.
 */

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
  generateImages: true,
  imageSize: '1K',
  useStyleReference: true,
});

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

function safeStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null; // storage disabled (e.g. strict privacy settings)
  }
}

export function sanitizeSettings(raw: unknown): Settings {
  const input = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
    typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
  return {
    textModel: isValidModelId(input.textModel) ? input.textModel.trim() : DEFAULT_SETTINGS.textModel,
    imageModel: isValidModelId(input.imageModel) ? input.imageModel.trim() : DEFAULT_SETTINGS.imageModel,
    thinkingLevel: pick(input.thinkingLevel, THINKING_LEVELS, DEFAULT_SETTINGS.thinkingLevel),
    generateImages:
      typeof input.generateImages === 'boolean' ? input.generateImages : DEFAULT_SETTINGS.generateImages,
    imageSize: pick(input.imageSize, IMAGE_SIZES, DEFAULT_SETTINGS.imageSize),
    useStyleReference:
      typeof input.useStyleReference === 'boolean' ? input.useStyleReference : DEFAULT_SETTINGS.useStyleReference,
  };
}

export function loadSettings(storage: Storage | null = safeStorage()): Settings {
  if (!storage) return { ...DEFAULT_SETTINGS };
  try {
    const raw = storage.getItem(STORAGE_KEYS.settings);
    return sanitizeSettings(raw ? JSON.parse(raw) : {});
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings, storage: Storage | null = safeStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEYS.settings, JSON.stringify(sanitizeSettings(settings)));
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
