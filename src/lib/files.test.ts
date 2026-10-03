import { loadDemo } from '../demo/samples';
import { PNG_BASE64 } from '../test/fetchMocks';
import { ScriptoError } from './errors';
import { fileNameFor, FILE_FORMAT, parseStoryboardFile, serializeStoryboard } from './files';
import { loadDraft, loadStoryboardLocally, saveDraft, saveStoryboardLocally } from './persist';
import { STORAGE_KEYS } from './settings';
import type { Storyboard } from './types';

function withImage(): Storyboard {
  const storyboard = loadDemo('clockmaker')!;
  storyboard.scenes[1]!.image = {
    src: `data:image/png;base64,${PNG_BASE64}`,
    mimeType: 'image/png',
    model: 'gemini-3.1-flash-image',
    createdAt: '2026-10-03T00:00:00.000Z',
  };
  return storyboard;
}

function kindOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (error) {
    return error instanceof ScriptoError ? error.kind : 'other';
  }
  return undefined;
}

describe('JSON export and import', () => {
  it('round-trips a storyboard, including images', () => {
    const original = withImage();
    const text = serializeStoryboard(original);
    expect(JSON.parse(text)).toMatchObject({ format: FILE_FORMAT, version: 1 });

    const { storyboard, warnings } = parseStoryboardFile(text);
    expect(warnings).toEqual([]);
    expect(storyboard.source).toBe('import');
    expect(storyboard.title).toBe(original.title);
    expect(storyboard.styleId).toBe(original.styleId);
    expect(storyboard.characters).toEqual(original.characters);
    expect(storyboard.story).toBe(original.story);
    expect(storyboard.scenes.map((s) => s.title)).toEqual(original.scenes.map((s) => s.title));
    expect(storyboard.scenes[1]!.image?.src).toBe(original.scenes[1]!.image?.src);
    expect(storyboard.scenes[0]!.image).toBeUndefined();
  });

  it('can leave images out', () => {
    const text = serializeStoryboard(withImage(), { includeImages: false });
    expect(text).not.toContain(PNG_BASE64);
  });

  it('keeps Arabic storyboards right to left', () => {
    const { storyboard } = parseStoryboardFile(serializeStoryboard(loadDemo('bottle')!));
    expect(storyboard.direction).toBe('rtl');
    expect(storyboard.language).toBe('ar');
  });

  it('drops images that are not image data URLs', () => {
    const storyboard = withImage();
    const data = JSON.parse(serializeStoryboard(storyboard));
    data.storyboard.scenes[1].image.src = 'https://tracker.example/pixel.png';
    data.storyboard.scenes[2].image = { src: 'data:text/html;base64,PHNjcmlwdD4=' };
    const parsed = parseStoryboardFile(JSON.stringify(data)).storyboard;
    expect(parsed.scenes[1]!.image).toBeUndefined();
    expect(parsed.scenes[2]!.image).toBeUndefined();
  });

  it('rejects invalid JSON, other formats and files without scenes', () => {
    expect(kindOf(() => parseStoryboardFile('{nope'))).toBe('input');
    expect(kindOf(() => parseStoryboardFile('{"format":"something-else","storyboard":{}}'))).toBe('input');
    expect(kindOf(() => parseStoryboardFile('{"title":"x","scenes":[]}'))).toBe('input');
  });

  it('accepts a bare storyboard object and repairs it', () => {
    const { storyboard, warnings } = parseStoryboardFile(
      JSON.stringify({ title: 'Bare', scenes: [{ description: 'A', mood: 'eerie', shot: 'CU' }], styleId: 'unknown' }),
    );
    expect(storyboard.scenes[0]).toMatchObject({ mood: 'mysterious', shot: 'close-up' });
    expect(storyboard.styleId).toBe('sketch');
    expect(warnings).toEqual([]);
  });

  it('builds readable file names', () => {
    expect(fileNameFor({ title: 'The Clockmaker of Lantern Street!' }, 'json')).toBe(
      'the-clockmaker-of-lantern-street-storyboard.json',
    );
    expect(fileNameFor({ title: 'رسالة في زجاجة' }, 'png')).toBe('رسالة-في-زجاجة-storyboard.png');
    expect(fileNameFor({ title: '???' }, 'png')).toBe('scripto-storyboard.png');
  });
});

describe('local persistence', () => {
  it('saves and restores the current storyboard with its source', () => {
    const storyboard = withImage();
    expect(saveStoryboardLocally(storyboard)).toBe('saved');
    const restored = loadStoryboardLocally();
    expect(restored?.source).toBe('demo');
    expect(restored?.scenes[1]!.image?.src).toBe(storyboard.scenes[1]!.image?.src);
  });

  it('falls back to saving without images when storage is full', () => {
    const data = new Map<string, string>();
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => {
        if (v.includes('base64')) throw new DOMException('full', 'QuotaExceededError');
        data.set(k, v);
      },
      removeItem: (k: string) => data.delete(k),
    } as unknown as Storage;
    expect(saveStoryboardLocally(withImage(), storage)).toBe('saved-without-images');
    expect(loadStoryboardLocally(storage)?.scenes[1]!.image).toBeUndefined();
  });

  it('clears the saved storyboard', () => {
    saveStoryboardLocally(withImage());
    expect(saveStoryboardLocally(null)).toBe('cleared');
    expect(window.localStorage.getItem(STORAGE_KEYS.storyboard)).toBeNull();
    expect(loadStoryboardLocally()).toBeNull();
  });

  it('ignores corrupted saved data', () => {
    window.localStorage.setItem(STORAGE_KEYS.storyboard, '{broken');
    expect(loadStoryboardLocally()).toBeNull();
  });

  it('keeps the story draft', () => {
    saveDraft('Once upon a time');
    expect(loadDraft()).toBe('Once upon a time');
    saveDraft('   ');
    expect(loadDraft()).toBe('');
  });
});
