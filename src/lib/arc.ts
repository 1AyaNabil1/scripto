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
