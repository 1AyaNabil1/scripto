import { arcPath, arcPoints, arcSummary } from '../lib/arc';
import { countWord, splitTitle } from './text';

describe('splitTitle', () => {
  it('splits a long title before its first connecting word', () => {
    expect(splitTitle('The Clockmaker of Lantern Street', false)).toEqual(['The Clockmaker', 'of Lantern Street']);
  });

  it('keeps short and right-to-left titles whole', () => {
    expect(splitTitle('The Last Lighthouse', false)).toEqual(['The Last Lighthouse', '']);
    expect(splitTitle('رسالة في زجاجة طويلة جدا', true)).toEqual(['رسالة في زجاجة طويلة جدا', '']);
  });
});

describe('countWord', () => {
  it('spells small counts', () => {
    expect(countWord(2)).toBe('Two');
    expect(countWord(0)).toBe('No');
    expect(countWord(40)).toBe('40');
  });
});

describe('arc geometry', () => {
  const scenes = [{ intensity: 1 }, { intensity: 5 }, { intensity: 3 }];

  it('puts intensity 5 at the top and spreads scenes across the width', () => {
    expect(arcPoints(scenes, false)).toEqual([
      { x: 6, y: 90 },
      { x: 50, y: 10 },
      { x: 94, y: 50 },
    ]);
  });

  it('mirrors the arc for right-to-left boards', () => {
    expect(arcPoints(scenes, true).map((p) => p.x)).toEqual([94, 50, 6]);
  });

  it('draws one smooth path through every point', () => {
    const d = arcPath(arcPoints(scenes, false));
    expect(d.startsWith('M6.00 90')).toBe(true);
    expect(d.match(/C/g)).toHaveLength(2);
  });

  it('describes the arc for screen readers', () => {
    expect(arcSummary(scenes)).toBe('Emotional arc across 3 scenes. Intensity runs 1, 5, 3 out of 5, peaking at scene 2.');
  });
});
