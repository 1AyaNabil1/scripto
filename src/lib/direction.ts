import type { TextDirection } from './types';

const RTL_LETTER = /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}]/gu;
const ANY_LETTER = /\p{L}/gu;
const RTL_LANGUAGES = new Set(['ar', 'arc', 'ckb', 'dv', 'fa', 'he', 'iw', 'ks', 'ku', 'ps', 'sd', 'syr', 'ug', 'ur', 'yi']);

/** "rtl" when most letters in the text come from right-to-left scripts. */
export function detectDirection(text: string): TextDirection {
  const letters = text.match(ANY_LETTER)?.length ?? 0;
  if (letters === 0) return 'ltr';
  const rtl = text.match(RTL_LETTER)?.length ?? 0;
  return rtl * 2 > letters ? 'rtl' : 'ltr';
}

export function directionForLanguage(tag: string): TextDirection {
  const primary = tag.trim().toLowerCase().split(/[-_]/)[0] ?? '';
  return RTL_LANGUAGES.has(primary) ? 'rtl' : 'ltr';
}

/** Detects the dominant script of the text first, falling back to the language tag. */
export function resolveDirection(sampleText: string, languageTag: string): TextDirection {
  const letters = sampleText.match(ANY_LETTER)?.length ?? 0;
  return letters >= 10 ? detectDirection(sampleText) : directionForLanguage(languageTag);
}
