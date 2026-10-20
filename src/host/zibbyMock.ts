/** Canned answers for `npm run dev:zibby`: no network, no credits. */
import { createMockStream, MOCK_IMAGE_DATA_URL } from '@zibby-run/app-kit/mock';
import { loadDemo } from '../demo/samples';
import { ZIBBY_ACTIONS, ZIBBY_QUOTES } from '../lib/zibbyPayloads';

function cannedStoryboard(): string {
  const demo = loadDemo('lighthouse');
  if (!demo) return '{}';
  const { title, logline, language, characters, scenes } = demo;
  // The model never sends ids or images; leave them out of the canned answer.
  return JSON.stringify({ title, logline, language, characters, scenes }, (key, value: unknown) =>
    key === 'id' || key === 'image' ? undefined : value,
  );
}

export const mockStream = createMockStream({
  cannedAnswer: (request) => (request.action === ZIBBY_ACTIONS.storyboard ? cannedStoryboard() : 'Here is the frame.'),
  quoteFor: (action) => (action === ZIBBY_ACTIONS.frame ? ZIBBY_QUOTES.frame : ZIBBY_QUOTES.storyboard),
  cannedImages: (request) => (request.action === ZIBBY_ACTIONS.frame ? [MOCK_IMAGE_DATA_URL] : []),
});
