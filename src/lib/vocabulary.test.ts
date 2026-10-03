import { MOODS, SHOTS } from './types';
import { MOOD_INFO, normalizeMood, normalizeShot, SHOT_LABELS } from './vocabulary';

describe('normalizeMood', () => {
  it('accepts canonical moods in any case', () => {
    for (const mood of MOODS) expect(normalizeMood(mood.toUpperCase())).toBe(mood);
  });

  it('maps common synonyms', () => {
    expect(normalizeMood('Eerie')).toBe('mysterious');
    expect(normalizeMood('suspenseful')).toBe('tense');
    expect(normalizeMood('nostalgic')).toBe('melancholic');
  });

  it('finds a known word inside a phrase', () => {
    expect(normalizeMood('quiet but ominous')).toBe('calm');
    expect(normalizeMood('a tense standoff')).toBe('tense');
  });

  it('returns undefined for unknown values', () => {
    expect(normalizeMood('purple')).toBeUndefined();
    expect(normalizeMood(42)).toBeUndefined();
  });
});

describe('normalizeShot', () => {
  it('accepts canonical shots', () => {
    for (const shot of SHOTS) expect(normalizeShot(shot)).toBe(shot);
  });

  it('maps spellings and abbreviations', () => {
    expect(normalizeShot('Close up')).toBe('close-up');
    expect(normalizeShot('ECU')).toBe('extreme-close-up');
    expect(normalizeShot('Wide Shot')).toBe('wide');
    expect(normalizeShot('POV')).toBe('point-of-view');
    expect(normalizeShot("Bird's eye")).toBe('aerial');
    expect(normalizeShot('low_angle')).toBe('low-angle');
    expect(normalizeShot('Over the shoulder shot')).toBe('over-the-shoulder');
  });

  it('returns undefined for unknown values', () => {
    expect(normalizeShot('dutch tilt')).toBeUndefined();
    expect(normalizeShot(undefined)).toBeUndefined();
  });
});

describe('labels', () => {
  it('has a label and palette for every mood and shot', () => {
    for (const mood of MOODS) expect(MOOD_INFO[mood].gradient).toHaveLength(2);
    for (const shot of SHOTS) expect(SHOT_LABELS[shot]).toBeTruthy();
  });
});
