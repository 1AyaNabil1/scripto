/**
 * Keeps the current storyboard and story draft between visits.
 *
 * localStorage holds the text (it is small and synchronous, so the board is
 * there on first paint). Frames are base64 images, usually too big for it, so
 * the whole board, frames included, also goes to IndexedDB when the browser
 * allows it. Both stay in this browser only.
 */
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

const SOURCES: readonly Storyboard['source'][] = ['demo', 'gemini', 'zibby', 'import'];

/** Parses a saved board and keeps the source it was saved with (a file import would say "import"). */
function restore(raw: string): Storyboard {
  const { storyboard } = parseStoryboardFile(raw);
  const source = (JSON.parse(raw) as { storyboard?: { source?: unknown } }).storyboard?.source;
  if (SOURCES.includes(source as Storyboard['source'])) storyboard.source = source as Storyboard['source'];
  return storyboard;
}

export function loadStoryboardLocally(storage: Storage | null = safeStorage()): Storyboard | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEYS.storyboard);
    return raw ? restore(raw) : null;
  } catch {
    return null;
  }
}

const DB_NAME = 'scripto';
const DB_STORE = 'boards';
const DB_KEY = 'current';

function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(DB_STORE);
      };
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = () => {
        resolve(null);
      };
      request.onblocked = () => {
        resolve(null);
      };
    } catch {
      resolve(null);
    }
  });
}

/** Saves (or, for null, deletes) the board with its frames. Resolves false when the browser refuses. */
export async function saveStoryboardWithFrames(storyboard: Storyboard | null): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(DB_STORE, 'readwrite');
      const store = tx.objectStore(DB_STORE);
      if (storyboard) store.put(serializeStoryboard(storyboard), DB_KEY);
      else store.delete(DB_KEY);
      tx.oncomplete = () => {
        db.close();
        resolve(true);
      };
      tx.onerror = tx.onabort = () => {
        db.close();
        resolve(false);
      };
    } catch {
      db.close();
      resolve(false);
    }
  });
}

/** The board saved with its frames, or null when there is none or the browser refuses. */
export async function loadStoryboardWithFrames(): Promise<Storyboard | null> {
  const db = await openDatabase();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const request = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(DB_KEY);
      request.onsuccess = () => {
        db.close();
        try {
          resolve(typeof request.result === 'string' ? restore(request.result) : null);
        } catch {
          resolve(null);
        }
      };
      request.onerror = () => {
        db.close();
        resolve(null);
      };
    } catch {
      db.close();
      resolve(null);
    }
  });
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
