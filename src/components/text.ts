import type { Storyboard } from '../lib/types';

const CONNECTORS = new Set(['of', 'in', 'at', 'on', 'and', 'from', 'to', 'with', 'under', 'behind', 'beyond', 'for']);

/**
 * Splits a Latin-script title into a bright lead and a muted tail
 * ("The Clockmaker" / "of Lantern Street"). Short titles and other scripts stay whole.
 */
export function splitTitle(title: string, rtl: boolean): [string, string] {
  const words = title.trim().split(/\s+/);
  if (rtl || words.length < 4) return [title, ''];
  const cut = words.findIndex((word, i) => i > 0 && CONNECTORS.has(word.toLowerCase()));
  const at = cut > 0 ? cut : Math.floor(words.length / 2);
  return [words.slice(0, at).join(' '), words.slice(at).join(' ')];
}

const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];

export function countWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** The board's language tag for `lang`, or undefined when the model could not tell. */
export function boardLang(storyboard: Pick<Storyboard, 'language'>): string | undefined {
  return storyboard.language && storyboard.language !== 'und' ? storyboard.language : undefined;
}
