import { MOODS, SHOTS, type Mood, type Shot } from './types';

export interface MoodInfo {
  label: string;
  /** Two stops for placeholder frames: a deep tint of the ground, then the mood's own colour. */
  gradient: readonly [string, string];
  /** The mood's colour in the arc, chips and frames. All eight stay inside the violet family. */
  accent: string;
}

/**
 * Moods share Scripto's violet palette: the hue moves a little (periwinkle,
 * lavender, orchid, magenta) and lightness carries most of the difference, so
 * the arc reads as one family. Mood is always named in text too, never by
 * colour alone.
 */
export const MOOD_INFO: Record<Mood, MoodInfo> = {
  joyful: { label: 'Joyful', gradient: ['#221c33', '#f5edff'], accent: '#f5edff' },
  hopeful: { label: 'Hopeful', gradient: ['#1f1933', '#d9c6ff'], accent: '#d9c6ff' },
  calm: { label: 'Calm', gradient: ['#161a2e', '#a9b6f5'], accent: '#a9b6f5' },
  romantic: { label: 'Romantic', gradient: ['#26152b', '#e8a9ee'], accent: '#e8a9ee' },
  mysterious: { label: 'Mysterious', gradient: ['#1a1530', '#9f86f2'], accent: '#9f86f2' },
  tense: { label: 'Tense', gradient: ['#25122b', '#d46be0'], accent: '#d46be0' },
  melancholic: { label: 'Melancholic', gradient: ['#17161f', '#7e7a9c'], accent: '#7e7a9c' },
  dramatic: { label: 'Dramatic', gradient: ['#170f2e', '#6a3bd8'], accent: '#6a3bd8' },
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
