/** Core data model for a Scripto storyboard. */

export const MOODS = [
  'joyful',
  'hopeful',
  'calm',
  'romantic',
  'mysterious',
  'tense',
  'melancholic',
  'dramatic',
] as const;
export type Mood = (typeof MOODS)[number];

export const SHOTS = [
  'establishing',
  'wide',
  'medium',
  'close-up',
  'extreme-close-up',
  'over-the-shoulder',
  'point-of-view',
  'low-angle',
  'high-angle',
  'aerial',
] as const;
export type Shot = (typeof SHOTS)[number];

export const LINE_TYPES = ['dialogue', 'narration'] as const;
export type LineType = (typeof LINE_TYPES)[number];

export type TextDirection = 'ltr' | 'rtl';

export interface Character {
  name: string;
  /** Visual description in English, reused in every image prompt. */
  appearance: string;
}

export interface SceneImage {
  /** A data: URL (base64). */
  src: string;
  mimeType: string;
  model: string;
  createdAt: string;
}

export interface Scene {
  id: string;
  title: string;
  description: string;
  characters: string[];
  setting: string;
  mood: Mood;
  /** Emotional intensity from 1 (quiet) to 5 (peak). */
  intensity: number;
  shot: Shot;
  lineType: LineType;
  /** Who speaks the line; empty for narration. */
  speaker: string;
  line: string;
  /** Concise English description of the frame, used for image generation. */
  visualPrompt: string;
  image?: SceneImage;
}

export interface Storyboard {
  version: 1;
  id: string;
  title: string;
  logline: string;
  /** BCP 47 language tag of the scene text, e.g. "en" or "ar". */
  language: string;
  direction: TextDirection;
  styleId: string;
  characters: Character[];
  scenes: Scene[];
  source: 'demo' | 'gemini' | 'import';
  createdAt: string;
  /** The story the storyboard was made from, when known. */
  story?: string;
}

export type SceneCountChoice = number | 'auto';

export const MIN_SCENES = 3;
export const MAX_SCENES = 10;
export const MAX_STORY_CHARS = 12000;
export const MIN_STORY_CHARS = 40;
