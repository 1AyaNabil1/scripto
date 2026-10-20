// @vitest-environment node
import { googleError, jsonResponse, mockFetch, requestBody, storyboardJson, TEST_KEY, textInteraction } from '../test/fetchMocks';
import { createRateLimiter } from './rateLimit';
import { createStoryboardHandler, PAID_ONLY_COUNTRIES, type HandlerConfig } from './storyboard';

const ORIGIN = 'https://moviconexus.me';
const STORY =
  'Lina folds a paper boat on a rainy morning and sets it on the gutter stream. She runs after it through the town until it reaches the sea.';

function call(body: unknown = { story: STORY, sceneCount: 3, styleId: 'sketch' }, headers: Record<string, string> = {}) {
  return new Request('https://scripto-api.test/api/storyboard', {
    method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'x-real-ip': '203.0.113.7', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function handler(fetchImpl: typeof fetch, overrides: Partial<HandlerConfig> = {}) {
  return createStoryboardHandler({ apiKey: TEST_KEY, fetchImpl, log: () => undefined, ...overrides });
}

async function kindOf(response: Response): Promise<string> {
  const body = (await response.json()) as { error?: { kind?: string } };
  return body.error?.kind ?? '';
}

const answer = () => jsonResponse(textInteraction(JSON.stringify(storyboardJson(3))));

describe('the scene writer', () => {
  it('builds the storyboard request itself and returns the model’s JSON', async () => {
    const fetchMock = mockFetch(answer());
    const response = await handler(fetchMock)(call());
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const { text } = (await response.json()) as { text: string };
    expect(JSON.parse(text)).toMatchObject({ title: 'The Paper Boat' });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
    expect(new Headers(init?.headers).get('x-goog-api-key')).toBe(TEST_KEY);
    const sent = requestBody(fetchMock);
    expect(sent).toMatchObject({ model: 'gemini-3.8-flash', store: false, generation_config: { thinking_level: 'low' } });
    expect(sent.system_instruction).toMatch(/You are Scripto/);
    expect(sent.input).toContain(STORY);
  });

  it('never puts the key in what it sends back', async () => {
    const fetchMock = mockFetch(
      jsonResponse(googleError(400, 'INVALID_ARGUMENT', `API key not valid: ${TEST_KEY}`, 'API_KEY_INVALID'), 400),
    );
    const log = vi.fn();
    const response = await handler(fetchMock, { log })(call());
    const text = await response.text();
    expect(response.status).toBe(502);
    expect(text).toBe('{"error":{"kind":"server"}}');
    expect(log).toHaveBeenCalledWith('scene writer: invalid-key (HTTP 400)');
    expect(JSON.stringify(log.mock.calls)).not.toContain(TEST_KEY);
  });

  it('uses another free-tier model when one is configured', async () => {
    const fetchMock = mockFetch(answer());
    await handler(fetchMock, { model: 'gemini-3.5-flash-lite' })(call());
    expect(requestBody(fetchMock).model).toBe('gemini-3.5-flash-lite');
  });

  it('answers the browser’s preflight for Scripto’s own pages', async () => {
    const response = await handler(mockFetch())(
      new Request('https://scripto-api.test/api/storyboard', { method: 'OPTIONS', headers: { Origin: ORIGIN } }),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
  });

  it('refuses other sites and calls without an origin', async () => {
    const fetchMock = mockFetch();
    const run = handler(fetchMock);
    const other = await run(call(undefined, { Origin: 'https://evil.example' }));
    expect(other.status).toBe(403);
    expect(other.headers.get('Access-Control-Allow-Origin')).toBeNull();
    const bare = new Request('https://scripto-api.test/api/storyboard', { method: 'POST', body: '{}' });
    expect((await run(bare)).status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('turns away visitors in the EEA, Switzerland and the UK', async () => {
    const fetchMock = mockFetch();
    for (const country of ['DE', 'FR', 'NO', 'CH', 'GB', 'gb']) {
      const response = await handler(fetchMock)(call(undefined, { 'x-vercel-ip-country': country }));
      expect(response.status).toBe(451);
      expect(await kindOf(response)).toBe('region');
    }
    expect(fetchMock).not.toHaveBeenCalled();
    expect(PAID_ONLY_COUNTRIES.size).toBe(39);
  });

  it('serves visitors elsewhere, Egypt included', async () => {
    const response = await handler(mockFetch(answer()))(call(undefined, { 'x-vercel-ip-country': 'EG' }));
    expect(response.status).toBe(200);
  });

  it('rejects anything but a short story, a scene count and a known look', async () => {
    const fetchMock = mockFetch();
    const run = handler(fetchMock);
    const bad = [
      'not json',
      { story: 'Too short.', sceneCount: 3, styleId: 'sketch' },
      { story: 'x'.repeat(12_001), sceneCount: 3, styleId: 'sketch' },
      { story: STORY, sceneCount: 11, styleId: 'sketch' },
      { story: STORY, sceneCount: 2.5, styleId: 'sketch' },
      { story: STORY, sceneCount: 3, styleId: 'photoreal' },
      { story: 42, sceneCount: 3, styleId: 'sketch' },
    ];
    for (const body of bad) {
      const response = await run(call(body));
      expect(response.status).toBe(400);
      expect(await kindOf(response)).toBe('input');
    }
    expect((await run(new Request('https://scripto-api.test/api/storyboard', { headers: { Origin: ORIGIN } }))).status).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts "auto" for the scene count', async () => {
    const response = await handler(mockFetch(answer()))(call({ story: STORY, sceneCount: 'auto', styleId: 'noir' }));
    expect(response.status).toBe(200);
  });

  it('limits each visitor and says how long to wait', async () => {
    const fetchMock = mockFetch(answer(), answer());
    const limiter = createRateLimiter([{ max: 2, windowMs: 60_000 }]);
    const run = handler(fetchMock, { limiter });
    expect((await run(call())).status).toBe(200);
    expect((await run(call())).status).toBe(200);
    const third = await run(call());
    expect(third.status).toBe(429);
    expect(third.headers.get('Retry-After')).toMatch(/^\d+$/);
    expect(await third.json()).toEqual({ error: { kind: 'rate', retryAfter: expect.any(Number) } });
    // Someone else is not held up.
    const elsewhere = mockFetch(answer());
    expect((await handler(elsewhere, { limiter })(call(undefined, { 'x-real-ip': '198.51.100.2' }))).status).toBe(200);
  });

  it('passes on Google’s quota, safety and truncation answers in its own words', async () => {
    const cases: [Response, number, string][] = [
      [jsonResponse(googleError(429, 'RESOURCE_EXHAUSTED', 'quota'), 429), 429, 'quota'],
      [jsonResponse({ ...textInteraction('', 'failed'), error: { message: 'blocked by safety policy' } }), 422, 'blocked'],
      [jsonResponse(textInteraction('{"title":', 'incomplete')), 502, 'incomplete'],
    ];
    for (const [reply, status, kind] of cases) {
      const response = await handler(mockFetch(reply))(call());
      expect(response.status).toBe(status);
      expect(await kindOf(response)).toBe(kind);
    }
  });

  it('gives up before the function’s time limit', async () => {
    const never = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('aborted', 'AbortError'));
          });
        }),
    );
    const response = await handler(never, { deadlineMs: 30 })(call());
    expect(response.status).toBe(504);
    expect(await kindOf(response)).toBe('timeout');
  });

  it('says it is not set up when the key is missing', async () => {
    const log = vi.fn();
    const response = await handler(mockFetch(), { apiKey: '', log })(call());
    expect(response.status).toBe(503);
    expect(log).toHaveBeenCalledWith('scene writer: GEMINI_API_KEY is not set');
  });
});

describe('the rate limiter', () => {
  it('counts per visitor within each window', () => {
    let now = 0;
    const limiter = createRateLimiter(
      [
        { max: 2, windowMs: 1000 },
        { max: 3, windowMs: 10_000 },
      ],
      () => now,
    );
    expect(limiter.take('a')).toBeNull();
    expect(limiter.take('a')).toBeNull();
    expect(limiter.take('a')).toBe(1);
    expect(limiter.take('b')).toBeNull();
    now = 1000;
    expect(limiter.take('a')).toBeNull();
    now = 2000;
    expect(limiter.take('a')).toBe(8);
    now = 10_000;
    expect(limiter.take('a')).toBeNull();
  });
});
