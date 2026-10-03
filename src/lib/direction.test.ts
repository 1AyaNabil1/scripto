import { detectDirection, directionForLanguage, resolveDirection } from './direction';

describe('text direction', () => {
  it('detects Arabic and Hebrew as right-to-left', () => {
    expect(detectDirection('كان يا ما كان في قديم الزمان')).toBe('rtl');
    expect(detectDirection('היה היה פעם')).toBe('rtl');
  });

  it('detects Latin text as left-to-right', () => {
    expect(detectDirection('Once upon a time')).toBe('ltr');
    expect(detectDirection('')).toBe('ltr');
    expect(detectDirection('1234 !!')).toBe('ltr');
  });

  it('follows the majority script in mixed text', () => {
    expect(detectDirection('قالت سلمى: OK')).toBe('rtl');
    expect(detectDirection('The word قمر means moon in Arabic')).toBe('ltr');
  });

  it('maps language tags', () => {
    expect(directionForLanguage('ar')).toBe('rtl');
    expect(directionForLanguage('ar-EG')).toBe('rtl');
    expect(directionForLanguage('fa')).toBe('rtl');
    expect(directionForLanguage('en-GB')).toBe('ltr');
    expect(directionForLanguage('und')).toBe('ltr');
  });

  it('prefers the text and falls back to the language tag for short samples', () => {
    expect(resolveDirection('A long English sentence here', 'ar')).toBe('ltr');
    expect(resolveDirection('', 'ar')).toBe('rtl');
  });
});
