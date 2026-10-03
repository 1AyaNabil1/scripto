import { storyboardJson } from '../test/fetchMocks';
import { ScriptoError } from './errors';
import { extractJson, normalizeScene, normalizeStoryboardData, parseStoryboardText } from './validate';

function kindOf(fn: () => unknown): string | undefined {
  try {
    fn();
  } catch (error) {
    return error instanceof ScriptoError ? error.kind : 'other';
  }
  return undefined;
}

describe('extractJson', () => {
  it('parses plain JSON', () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
  });

  it('strips markdown code fences and surrounding chatter', () => {
    expect(extractJson('Here you go:\n```json\n{"a":1}\n```\nEnjoy!')).toEqual({ a: 1 });
    expect(extractJson('Sure! {"a":[1,2]} Hope that helps.')).toEqual({ a: [1, 2] });
  });

  it('reports invalid JSON as a parse error with a short excerpt', () => {
    try {
      extractJson('{"title": "Unclosed');
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ScriptoError);
      expect((error as ScriptoError).kind).toBe('parse');
      expect((error as ScriptoError).detail).toContain('Unclosed');
    }
  });

  it('reports an empty answer', () => {
    expect(kindOf(() => extractJson('   '))).toBe('bad-response');
  });
});

describe('parseStoryboardText', () => {
  it('accepts a well-formed storyboard', () => {
    const parsed = parseStoryboardText(JSON.stringify(storyboardJson(3)), { expected: { min: 3, max: 3 } });
    expect(parsed.title).toBe('The Paper Boat');
    expect(parsed.language).toBe('en');
    expect(parsed.characters).toHaveLength(1);
    expect(parsed.scenes).toHaveLength(3);
    expect(parsed.warnings).toEqual([]);
    expect(parsed.scenes[1]).toMatchObject({ lineType: 'dialogue', speaker: 'Lina', shot: 'close-up' });
    expect(new Set(parsed.scenes.map((s) => s.id)).size).toBe(3);
  });

  it('warns when the scene count differs from what was asked', () => {
    const parsed = parseStoryboardText(JSON.stringify(storyboardJson(4)), { expected: { min: 6, max: 6 } });
    expect(parsed.scenes).toHaveLength(4);
    expect(parsed.warnings).toContain('Asked for 6 scenes and got 4.');
  });

  it('accepts a bare array of scenes', () => {
    const parsed = parseStoryboardText(JSON.stringify(storyboardJson(2).scenes));
    expect(parsed.scenes).toHaveLength(2);
    expect(parsed.title).toBe('Untitled storyboard');
    expect(parsed.language).toBe('und');
  });

  it('fails clearly when there are no scenes', () => {
    expect(kindOf(() => parseStoryboardText('{"title":"x","scenes":[]}'))).toBe('validation');
    expect(kindOf(() => parseStoryboardText('{"title":"x"}'))).toBe('validation');
  });

  it('fails clearly when no scene is usable', () => {
    expect(kindOf(() => parseStoryboardText('{"scenes":[1, "two", {"title":"no body"}]}'))).toBe('validation');
  });

  it('keeps at most ten scenes', () => {
    const parsed = parseStoryboardText(JSON.stringify(storyboardJson(14)));
    expect(parsed.scenes).toHaveLength(10);
    expect(parsed.warnings.join(' ')).toMatch(/keeping the first 10/);
  });

  it('drops duplicate cast members and empty names', () => {
    const data = {
      ...storyboardJson(1),
      characters: [
        { name: 'Lina', appearance: 'a' },
        { name: 'lina', appearance: 'b' },
        { name: '', appearance: 'c' },
        'not an object',
      ],
    };
    expect(normalizeStoryboardData(data).characters).toEqual([{ name: 'Lina', appearance: 'a' }]);
  });
});

describe('normalizeScene', () => {
  it('repairs off-list moods and shots and reports them', () => {
    const { scene, problems } = normalizeScene(
      { description: 'x', mood: 'eerie', shot: 'Dutch tilt', intensity: '9', lineType: 'shout' },
      0,
    );
    expect(scene).toMatchObject({ mood: 'mysterious', shot: 'medium', intensity: 5, lineType: 'narration' });
    expect(problems).toEqual(['Scene 1: unknown camera shot, using "medium".']);
  });

  it('falls back to calm for unknown moods', () => {
    const { scene, problems } = normalizeScene({ description: 'x', mood: 'purple', shot: 'wide' }, 2);
    expect(scene?.mood).toBe('calm');
    expect(problems[0]).toMatch(/Scene 3: unknown mood "purple"/);
  });

  it('splits comma-separated character strings, including the Arabic comma', () => {
    const { scene } = normalizeScene({ description: 'x', characters: 'سلمى، الجدة, Omar , ,Omar' }, 0);
    expect(scene?.characters).toEqual(['سلمى', 'الجدة', 'Omar']);
  });

  it('turns dialogue without a speaker into narration', () => {
    const { scene } = normalizeScene({ description: 'x', lineType: 'dialogue', speaker: '  ', line: 'Hi' }, 0);
    expect(scene).toMatchObject({ lineType: 'narration', speaker: '' });
  });

  it('clears the speaker for narration', () => {
    const { scene } = normalizeScene({ description: 'x', lineType: 'narration', speaker: 'Bob' }, 0);
    expect(scene?.speaker).toBe('');
  });

  it('fills a default title and intensity', () => {
    const { scene } = normalizeScene({ visualPrompt: 'a door' }, 4);
    expect(scene).toMatchObject({ title: 'Scene 5', intensity: 3, description: '' });
  });

  it('trims, strips control characters and caps long text', () => {
    const { scene } = normalizeScene({ description: `  hello\u0007 ${'w'.repeat(2000)}` }, 0);
    expect(scene?.description.startsWith('hello w')).toBe(true);
    expect(scene?.description.length).toBeLessThanOrEqual(800);
    expect(scene?.description.endsWith('…')).toBe(true);
  });

  it('skips non-objects and scenes without any description', () => {
    expect(normalizeScene(null, 0).scene).toBeUndefined();
    expect(normalizeScene({ title: 'Only a title' }, 0).scene).toBeUndefined();
  });
});
