import { detectDirection } from '../lib/direction';
import { validateStoryInput } from '../lib/generate';
import { getStyle } from '../lib/styles';
import { MOODS, SHOTS } from '../lib/types';
import { normalizeStoryboardData } from '../lib/validate';
import { DEMO_ENTRIES, loadDemo } from './samples';

describe('demo storyboards', () => {
  it('ships two demos that need no API key', () => {
    expect(DEMO_ENTRIES).toHaveLength(2);
    for (const entry of DEMO_ENTRIES) {
      const storyboard = loadDemo(entry.id)!;
      expect(storyboard.source).toBe('demo');
      expect(storyboard.scenes.every((s) => s.image === undefined)).toBe(true);
    }
  });

  it.each(DEMO_ENTRIES.map((e) => [e.id]))('%s is a valid storyboard', (id) => {
    const storyboard = loadDemo(id)!;
    expect(storyboard.scenes.length).toBeGreaterThanOrEqual(3);
    expect(new Set(storyboard.scenes.map((s) => s.id)).size).toBe(storyboard.scenes.length);
    expect(getStyle(storyboard.styleId).id).toBe(storyboard.styleId);
    expect(() => {
      validateStoryInput(storyboard.story ?? '');
    }).not.toThrow();

    const castNames = new Set(storyboard.characters.map((c) => c.name));
    for (const scene of storyboard.scenes) {
      expect(MOODS).toContain(scene.mood);
      expect(SHOTS).toContain(scene.shot);
      expect(scene.intensity).toBeGreaterThanOrEqual(1);
      expect(scene.intensity).toBeLessThanOrEqual(5);
      expect(scene.description).not.toBe('');
      expect(scene.line).not.toBe('');
      expect(scene.visualPrompt).not.toBe('');
      for (const name of scene.characters) expect(castNames).toContain(name);
      if (scene.lineType === 'dialogue') expect(castNames).toContain(scene.speaker);
      else expect(scene.speaker).toBe('');
    }

    // The demo data passes the same validation as model output, without repairs.
    const parsed = normalizeStoryboardData(storyboard);
    expect(parsed.warnings).toEqual([]);
    expect(parsed.scenes).toHaveLength(storyboard.scenes.length);
  });

  it('includes an Arabic story that renders right to left', () => {
    const arabic = loadDemo('bottle')!;
    expect(arabic.language).toBe('ar');
    expect(arabic.direction).toBe('rtl');
    expect(detectDirection(arabic.story ?? '')).toBe('rtl');
    expect(detectDirection(arabic.scenes.map((s) => s.description).join(' '))).toBe('rtl');
  });

  it('uses varied shots and moods so the placeholders and chart are interesting', () => {
    for (const entry of DEMO_ENTRIES) {
      const scenes = loadDemo(entry.id)!.scenes;
      expect(new Set(scenes.map((s) => s.shot)).size).toBe(scenes.length);
      expect(new Set(scenes.map((s) => s.mood)).size).toBeGreaterThanOrEqual(4);
    }
  });

  it('returns independent copies', () => {
    const a = loadDemo('clockmaker')!;
    const b = loadDemo('clockmaker')!;
    a.scenes[0]!.title = 'Changed';
    a.scenes[0]!.characters.push('Someone');
    expect(b.scenes[0]!.title).toBe('The lantern market');
    expect(b.scenes[0]!.characters).toEqual(['Ilyas']);
    expect(a.scenes[0]!.id).not.toBe(b.scenes[0]!.id);
  });

  it('returns undefined for unknown demos', () => {
    expect(loadDemo('nope')).toBeUndefined();
  });
});
