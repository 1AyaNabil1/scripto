/** JSON export/import and file downloads. */
import { resolveDirection } from './direction';
import { ScriptoError } from './errors';
import { fromDataUrl } from './gemini';
import { makeId } from './ids';
import { getStyle } from './styles';
import { MAX_SCENES, type Scene, type Storyboard } from './types';
import { normalizeScene, normalizeStoryboardData } from './validate';

export const FILE_FORMAT = 'scripto-storyboard';
export const FILE_VERSION = 1;
/** Imported files larger than this are refused (images are base64). */
export const MAX_IMPORT_BYTES = 40 * 1024 * 1024;
const MAX_IMAGE_CHARS = 12 * 1024 * 1024;

export interface ExportOptions {
  includeImages?: boolean;
}

export function serializeStoryboard(storyboard: Storyboard, options: ExportOptions = {}): string {
  const includeImages = options.includeImages ?? true;
  const scenes = storyboard.scenes.map((scene) => {
    if (includeImages || !scene.image) return scene;
    const copy = { ...scene };
    delete copy.image;
    return copy;
  });
  return JSON.stringify(
    {
      format: FILE_FORMAT,
      version: FILE_VERSION,
      exportedAt: new Date().toISOString(),
      storyboard: { ...storyboard, scenes },
    },
    null,
    2,
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function importedImage(raw: unknown): Scene['image'] {
  if (!isObject(raw) || typeof raw.src !== 'string' || raw.src.length > MAX_IMAGE_CHARS) return undefined;
  const parts = fromDataUrl(raw.src);
  if (!parts) return undefined;
  return {
    src: raw.src,
    mimeType: parts.mimeType,
    model: typeof raw.model === 'string' ? raw.model.slice(0, 80) : 'unknown',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt.slice(0, 40) : '',
  };
}

/**
 * Reads a storyboard exported by Scripto (or a bare storyboard object).
 * Everything is re-validated; images are kept only if they are image data URLs.
 */
export function parseStoryboardFile(text: string): { storyboard: Storyboard; warnings: string[] } {
  if (text.length > MAX_IMPORT_BYTES) {
    throw new ScriptoError('input', 'This file is too large to import.');
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ScriptoError('input', 'This file is not valid JSON. Choose a storyboard exported from Scripto.');
  }
  const root = isObject(data) && isObject(data.storyboard) ? data.storyboard : data;
  if (isObject(data) && data.format !== undefined && data.format !== FILE_FORMAT) {
    throw new ScriptoError('input', 'This JSON file is not a Scripto storyboard.');
  }

  let base;
  try {
    base = normalizeStoryboardData(root);
  } catch (error) {
    if (error instanceof ScriptoError) {
      throw new ScriptoError('input', 'This file does not contain any usable scenes.');
    }
    throw error;
  }

  // Re-read scenes one by one so images stay attached to the right scene.
  const rawScenes = isObject(root) && Array.isArray(root.scenes) ? (root.scenes as unknown[]) : [];
  const scenes: Scene[] = [];
  rawScenes.forEach((raw, i) => {
    const { scene } = normalizeScene(raw, i);
    if (!scene || scenes.length >= MAX_SCENES) return;
    const image = isObject(raw) ? importedImage(raw.image) : undefined;
    scenes.push(image ? { ...scene, image } : scene);
  });

  const meta = isObject(root) ? root : {};
  const story = typeof meta.story === 'string' ? meta.story.slice(0, 20000) : undefined;
  const sample = scenes.map((s) => `${s.description} ${s.line}`).join(' ');
  const storyboard: Storyboard = {
    version: 1,
    id: makeId('sb'),
    title: base.title,
    logline: base.logline,
    language: base.language,
    direction: resolveDirection(sample, base.language),
    styleId: getStyle(typeof meta.styleId === 'string' ? meta.styleId : undefined).id,
    characters: base.characters,
    scenes: scenes.length > 0 ? scenes : base.scenes,
    source: 'import',
    createdAt: typeof meta.createdAt === 'string' ? meta.createdAt.slice(0, 40) : new Date().toISOString(),
    ...(story ? { story } : {}),
  };
  return { storyboard, warnings: base.warnings };
}

/** A filesystem-friendly name such as "the-paper-boat-storyboard.json". */
export function fileNameFor(storyboard: Pick<Storyboard, 'title'>, extension: string): string {
  const slug = storyboard.title
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${slug || 'scripto'}-storyboard.${extension}`;
}

/** Saves a Blob through a temporary download link. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 10_000);
}
