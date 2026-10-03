/** Keeps the current storyboard and story draft in localStorage between visits. */
import { parseStoryboardFile, serializeStoryboard } from './files';
import { safeStorage, STORAGE_KEYS } from './settings';
import type { Storyboard } from './types';

export type SaveResult = 'saved' | 'saved-without-images' | 'cleared' | 'failed';

export function saveStoryboardLocally(storyboard: Storyboard | null, storage: Storage | null = safeStorage()): SaveResult {
  if (!storage) return 'failed';
  try {
    if (!storyboard) {
      storage.removeItem(STORAGE_KEYS.storyboard);
      return 'cleared';
    }
    try {
      storage.setItem(STORAGE_KEYS.storyboard, serializeStoryboard(storyboard));
      return 'saved';
    } catch {
      // Images can exceed the storage quota; keep the text at least.
      storage.setItem(STORAGE_KEYS.storyboard, serializeStoryboard(storyboard, { includeImages: false }));
      return 'saved-without-images';
    }
  } catch {
    return 'failed';
  }
}

export function loadStoryboardLocally(storage: Storage | null = safeStorage()): Storyboard | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEYS.storyboard);
    if (!raw) return null;
    const { storyboard } = parseStoryboardFile(raw);
    const source = (JSON.parse(raw) as { storyboard?: { source?: unknown } }).storyboard?.source;
    if (source === 'demo' || source === 'gemini' || source === 'import') storyboard.source = source;
    return storyboard;
  } catch {
    return null;
  }
}

export function loadDraft(storage: Storage | null = safeStorage()): string {
  try {
    return storage?.getItem(STORAGE_KEYS.draft) ?? '';
  } catch {
    return '';
  }
}

export function saveDraft(text: string, storage: Storage | null = safeStorage()): void {
  try {
    if (text.trim()) storage?.setItem(STORAGE_KEYS.draft, text);
    else storage?.removeItem(STORAGE_KEYS.draft);
  } catch {
    // Drafts are a convenience; ignore storage failures.
  }
}
