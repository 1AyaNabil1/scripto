import { jsonResponse, mockFetch, requestBody } from '../test/fetchMocks';
import { ScriptoError } from './errors';
import { defaultSettings } from './settings';
import { createSiteBackend } from './siteApi';
import { getStyle } from './styles';

const API = 'https://scripto-api.test';
const STORY = 'Lina folds a paper boat on a rainy morning and sets it on the gutter stream.';

function write(fetchImpl: typeof fetch, signal?: AbortSignal, timeoutMs?: number) {
  return createSiteBackend({ apiUrl: API, fetchImpl, ...(timeoutMs ? { timeoutMs } : {}) }).writeStoryboard({
    story: STORY,
    sceneCount: 'auto',
    style: getStyle('noir'),
    settings: defaultSettings(),
    signal,
  });
}

async function failure(promise: Promise<unknown>): Promise<ScriptoError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ScriptoError) return error;
    throw error;
  }
  throw new Error('expected the promise to reject');
}

describe('the free site’s backend', () => {
  it('posts the story, the count and the look, and nothing else', async () => {
    const fetchMock = mockFetch(jsonResponse({ text: '{"title":"x"}' }));
    expect(await write(fetchMock)).toEqual({ text: '{"title":"x"}' });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`${API}/api/storyboard`);
    expect(init).toMatchObject({ method: 'POST', credentials: 'omit', cache: 'no-store' });
    expect(requestBody(fetchMock)).toEqual({ story: STORY, sceneCount: 'auto', styleId: 'noir' });
  });

  it('turns each refusal into a plain message', async () => {
    const cases: [unknown, number, string, RegExp][] = [
      [{ error: { kind: 'rate', retryAfter: 30 } }, 429, 'rate', /Wait a minute/],
      [{ error: { kind: 'rate', retryAfter: 40_000 } }, 429, 'rate', /Come back tomorrow/],
      [{ error: { kind: 'quota' } }, 429, 'quota', /free Google quota/],
      [{ error: { kind: 'region' } }, 451, 'region', /EU, the UK or Switzerland/],
      [{ error: { kind: 'blocked' } }, 422, 'blocked', /safety filters/],
      [{ error: { kind: 'origin' } }, 403, 'server', /not allowed/],
      [{ error: { kind: 'something new' } }, 500, 'server', /unavailable right now/],
      ['<html>Bad gateway</html>', 502, 'server', /unavailable right now/],
    ];
    for (const [body, status, kind, message] of cases) {
      const reply = typeof body === 'string' ? new Response(body, { status }) : jsonResponse(body, status);
      const error = await failure(write(mockFetch(reply)));
      expect(error.kind).toBe(kind);
      expect(error.message).toMatch(message);
      expect(error.status).toBe(status);
    }
  });

  it('rejects an answer without the storyboard text', async () => {
    expect((await failure(write(mockFetch(jsonResponse({ nope: true }))))).kind).toBe('bad-response');
  });

  it('tells a cancel from a dropped connection and a timeout', async () => {
    const controller = new AbortController();
    const hang = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'));
          });
        }),
    );
    const cancelled = write(hang, controller.signal);
    controller.abort();
    expect((await failure(cancelled)).kind).toBe('aborted');
    expect((await failure(write(hang, undefined, 5))).kind).toBe('timeout');
    expect((await failure(write(mockFetch(new TypeError('Failed to fetch'))))).kind).toBe('network');
  });

  it('does not draw frames', async () => {
    const backend = createSiteBackend({ apiUrl: API, fetchImpl: mockFetch() });
    const error = await failure(backend.drawFrame({ prompt: 'a frame', settings: defaultSettings() }));
    expect(error.kind).toBe('no-image');
  });
});
