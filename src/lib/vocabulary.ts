import { MOODS, SHOTS, type Mood, type Shot } from './types';

export interface MoodInfo {
  label: string;
  /** Two gradient stops for placeholder frames (dark to light). */
  gradient: readonly [string, string];
  /** Accent used for chips and the mood chart; readable on light and dark. */
  accent: string;
}

export const MOOD_INFO: Record<Mood, MoodInfo> = {
  joyful: { label: 'Joyful', gradient: ['#b45309', '#fcd34d'], accent: '#d97706' },
  hopeful: { label: 'Hopeful', gradient: ['#0f766e', '#99f6e4'], accent: '#0d9488' },
  calm: { label: 'Calm', gradient: ['#1e3a8a', '#93c5fd'], accent: '#3b82f6' },
  romantic: { label: 'Romantic', gradient: ['#9d174d', '#fbcfe8'], accent: '#db2777' },
  mysterious: { label: 'Mysterious', gradient: ['#1e1b4b', '#818cf8'], accent: '#6366f1' },
  tense: { label: 'Tense', gradient: ['#450a0a', '#f87171'], accent: '#dc2626' },
  melancholic: { label: 'Melancholic', gradient: ['#1f2937', '#9ca3af'], accent: '#6b7280' },
  dramatic: { label: 'Dramatic', gradient: ['#3b0764', '#f97316'], accent: '#9333ea' },
};

export const SHOT_LABELS: Record<Shot, string> = {
  establishing: 'Establishing shot',
  wide: 'Wide shot',
  medium: 'Medium shot',
  'close-up': 'Close-up',
  'extreme-close-up': 'Extreme close-up',
  'over-the-shoulder': 'Over the shoulder',
  'point-of-view': 'Point of view',
  'low-angle': 'Low angle',
  'high-angle': 'High angle',
  aerial: 'Aerial shot',
};

/** Words models commonly use instead of the canonical mood names. */
const MOOD_SYNONYMS: Record<string, Mood> = {
  happy: 'joyful',
  cheerful: 'joyful',
  playful: 'joyful',
  triumphant: 'joyful',
  celebratory: 'joyful',
  warm: 'hopeful',
  uplifting: 'hopeful',
  determined: 'hopeful',
  inspiring: 'hopeful',
  peaceful: 'calm',
  serene: 'calm',
  quiet: 'calm',
  tranquil: 'calm',
  nostalgic: 'melancholic',
  sad: 'melancholic',
  somber: 'melancholic',
  sombre: 'melancholic',
  lonely: 'melancholic',
  bittersweet: 'melancholic',
  grief: 'melancholic',
  loving: 'romantic',
  tender: 'romantic',
  intimate: 'romantic',
  eerie: 'mysterious',
  curious: 'mysterious',
  suspenseful: 'tense',
  suspense: 'tense',
  anxious: 'tense',
  ominous: 'tense',
  scary: 'tense',
  fearful: 'tense',
  menacing: 'tense',
  urgent: 'tense',
  epic: 'dramatic',
  intense: 'dramatic',
  climactic: 'dramatic',
  action: 'dramatic',
  chaotic: 'dramatic',
  angry: 'dramatic',
};

const SHOT_SYNONYMS: Record<string, Shot> = {
  establishing: 'establishing',
  'establishing shot': 'establishing',
  'extreme wide': 'establishing',
  'extreme long shot': 'establishing',
  wide: 'wide',
  'wide shot': 'wide',
  'long shot': 'wide',
  'full shot': 'wide',
  ws: 'wide',
  ls: 'wide',
  medium: 'medium',
  'medium shot': 'medium',
  'mid shot': 'medium',
  'medium wide': 'medium',
  'medium long shot': 'medium',
  'two shot': 'medium',
  ms: 'medium',
  'medium close-up': 'close-up',
  'medium close up': 'close-up',
  'close-up': 'close-up',
  'close up': 'close-up',
  closeup: 'close-up',
  cu: 'close-up',
  mcu: 'close-up',
  'extreme close-up': 'extreme-close-up',
  'extreme close up': 'extreme-close-up',
  'extreme-close-up': 'extreme-close-up',
  ecu: 'extreme-close-up',
  insert: 'extreme-close-up',
  'insert shot': 'extreme-close-up',
  'over the shoulder': 'over-the-shoulder',
  'over-the-shoulder': 'over-the-shoulder',
  ots: 'over-the-shoulder',
  pov: 'point-of-view',
  'point of view': 'point-of-view',
  'point-of-view': 'point-of-view',
  'low angle': 'low-angle',
  'low-angle': 'low-angle',
  'high angle': 'high-angle',
  'high-angle': 'high-angle',
  "bird's eye": 'aerial',
  'birds eye': 'aerial',
  "bird's-eye view": 'aerial',
  aerial: 'aerial',
  'aerial shot': 'aerial',
  overhead: 'aerial',
  drone: 'aerial',
};

function simplify(value: string): string {
  return value.toLowerCase().replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Maps free-form mood words onto the fixed mood palette. */
export function normalizeMood(value: unknown): Mood | undefined {
  if (typeof value !== 'string') return undefined;
  const simple = simplify(value);
  if ((MOODS as readonly string[]).includes(simple)) return simple as Mood;
  if (simple in MOOD_SYNONYMS) return MOOD_SYNONYMS[simple];
  // "tense and eerie" -> first recognised word
  for (const word of simple.split(/[^a-z]+/)) {
    if ((MOODS as readonly string[]).includes(word)) return word as Mood;
    if (word in MOOD_SYNONYMS) return MOOD_SYNONYMS[word];
  }
  return undefined;
}

/** Maps free-form camera shot names onto the fixed shot list. */
export function normalizeShot(value: unknown): Shot | undefined {
  if (typeof value !== 'string') return undefined;
  const simple = simplify(value).replace(/[()]/g, '');
  if ((SHOTS as readonly string[]).includes(simple)) return simple as Shot;
  if (simple in SHOT_SYNONYMS) return SHOT_SYNONYMS[simple];
  const withoutShot = simple.replace(/\s*shot$/, '');
  if (withoutShot in SHOT_SYNONYMS) return SHOT_SYNONYMS[withoutShot];
  const hyphenated = withoutShot.replace(/\s+/g, '-');
  if ((SHOTS as readonly string[]).includes(hyphenated)) return hyphenated as Shot;
  return undefined;
}

export function moodLabel(mood: Mood): string {
  return MOOD_INFO[mood].label;
}

export function shotLabel(shot: Shot): string {
  return SHOT_LABELS[shot];
}
