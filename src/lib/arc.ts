import type { Mood, Scene } from './types';

export interface MoodCount {
  mood: Mood;
  count: number;
}

/** Moods in order of first appearance, with how many scenes have each. */
export function moodCounts(scenes: readonly Pick<Scene, 'mood'>[]): MoodCount[] {
  const counts = new Map<Mood, number>();
  for (const scene of scenes) counts.set(scene.mood, (counts.get(scene.mood) ?? 0) + 1);
  return [...counts.entries()].map(([mood, count]) => ({ mood, count }));
}

/** Index of the first scene with the highest intensity. */
export function peakIndex(scenes: readonly Pick<Scene, 'intensity'>[]): number {
  let best = -1;
  scenes.forEach((scene, i) => {
    const current = scenes[best];
    if (!current || scene.intensity > current.intensity) best = i;
  });
  return best;
}

/** Where each scene sits, in percent of the chart: x along the story, y by intensity (5 at the top). */
export function arcPoints(scenes: readonly Pick<Scene, 'intensity'>[], rtl: boolean): { x: number; y: number }[] {
  const n = scenes.length;
  return scenes.map((scene, i) => {
    const t = n <= 1 ? 50 : 6 + (i * 88) / (n - 1);
    const level = Math.min(5, Math.max(1, Math.round(scene.intensity)));
    return { x: rtl ? 100 - t : t, y: 90 - (level - 1) * 20 };
  });
}

/** A smooth path through the points (horizontal tangents, so peaks stay where they are). */
export function arcPath(points: readonly { x: number; y: number }[]): string {
  const [first, ...rest] = points;
  if (!first) return '';
  let d = `M${first.x.toFixed(2)} ${first.y}`;
  let prev = first;
  for (const point of rest) {
    const mx = ((prev.x + point.x) / 2).toFixed(2);
    d += ` C${mx} ${prev.y} ${mx} ${point.y} ${point.x.toFixed(2)} ${point.y}`;
    prev = point;
  }
  return d;
}

export function arcSummary(scenes: readonly Pick<Scene, 'intensity'>[]): string {
  const peak = peakIndex(scenes);
  return `Emotional arc across ${scenes.length} scenes. Intensity runs ${scenes
    .map((s) => s.intensity)
    .join(', ')} out of 5${peak >= 0 ? `, peaking at scene ${peak + 1}` : ''}.`;
}
