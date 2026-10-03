import { clampLines, computeLayout, wrapText } from './exportImage';
import { formatLine } from './format';

// One unit of width per character keeps the maths obvious.
const measure = (text: string) => text.length;

describe('wrapText', () => {
  it('wraps on word boundaries', () => {
    expect(wrapText('the quick brown fox jumps', 10, measure)).toEqual(['the quick', 'brown fox', 'jumps']);
  });

  it('keeps explicit line breaks', () => {
    expect(wrapText('one\ntwo three', 20, measure)).toEqual(['one', 'two three']);
  });

  it('breaks words that are longer than a line', () => {
    expect(wrapText('abcdefghijkl xy', 5, measure)).toEqual(['abcde', 'fghij', 'kl xy']);
  });

  it('wraps Arabic text the same way', () => {
    expect(wrapText('كان يا ما كان', 7, measure)).toEqual(['كان يا', 'ما كان']);
  });
});

describe('clampLines', () => {
  it('adds an ellipsis when lines are cut', () => {
    expect(clampLines(['aaaa', 'bbbb', 'cccc'], 2, measure, 4)).toEqual(['aaaa', 'bbb…']);
  });

  it('leaves short text alone', () => {
    expect(clampLines(['a'], 3, measure, 10)).toEqual(['a']);
  });
});

describe('computeLayout', () => {
  it('uses two columns for short storyboards and three for longer ones', () => {
    expect(computeLayout(4).columns).toBe(2);
    expect(computeLayout(6).columns).toBe(3);
  });

  it('grows with the number of rows', () => {
    expect(computeLayout(9).height).toBeGreaterThan(computeLayout(3).height);
    expect(computeLayout(6).width).toBe(computeLayout(9).width);
  });
});

describe('formatLine', () => {
  it('quotes dialogue with the speaker', () => {
    expect(formatLine({ lineType: 'dialogue', speaker: 'Noor', line: 'Hello' }, false)).toBe('Noor: “Hello”');
    expect(formatLine({ lineType: 'dialogue', speaker: 'سلمى', line: 'مرحبا' }, true)).toBe('سلمى: «مرحبا»');
  });

  it('does not double-quote and leaves narration bare', () => {
    expect(formatLine({ lineType: 'dialogue', speaker: 'A', line: '«already»' }, true)).toBe('A: «already»');
    expect(formatLine({ lineType: 'narration', speaker: '', line: 'It rained.' }, false)).toBe('It rained.');
  });
});
