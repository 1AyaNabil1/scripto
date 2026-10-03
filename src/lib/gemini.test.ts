import {
  googleError,
  imageInteraction,
  jsonResponse,
  mockFetch,
  PNG_BASE64,
  requestBody,
  TEST_KEY,
  textInteraction,
} from '../test/fetchMocks';
import { ScriptoError } from './errors';
import {
  assertFinished,
  createInteraction,
  extractImage,
  extractText,
  fromDataUrl,
  INTERACTIONS_ENDPOINT,
  toDataUrl,
} from './gemini';
import type { InteractionRequest } from './prompts';

const request: InteractionRequest = { model: 'gemini-3.8-flash', input: 'Hello', store: false };

async function failure(promise: Promise<unknown>): Promise<ScriptoError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ScriptoError) return error;
    throw error;
  }
  throw new Error('expected the promise to reject');
}

describe('createInteraction', () => {
  it('POSTs to the Interactions endpoint with the key in a header, not the URL', async () => {
    const fetchMock = mockFetch(jsonResponse(textInteraction('Hi')));
    await createInteraction(request, { apiKey: TEST_KEY, purpose: 'text', fetchImpl: fetchMock });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(INTERACTIONS_ENDPOINT);
    expect(INTERACTIONS_ENDPOINT).toBe('https://generativelanguage.googleapis.com/v1beta/interactions');
    expect(url as string).not.toContain(TEST_KEY);
    expect(init?.method).toBe('POST');
    expect(init?.credentials).toBe('omit');
    expect((init?.headers as Record<string, string>)['x-goog-api-key']).toBe(TEST_KEY);
    expect(init?.body as string).not.toContain(TEST_KEY);
    expect(requestBody(fetchMock)).toEqual(request);
  });

  it('refuses to call the API without a key', async () => {
    const fetchMock = mockFetch();
    const error = await failure(createInteraction(request, { apiKey: '  ', purpose: 'text', fetchImpl: fetchMock }));
    expect(error.kind).toBe('missing-key');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects malformed model IDs before sending anything', async () => {
    const fetchMock = mockFetch();
    const error = await failure(
      createInteraction({ ...request, model: '../../evil' }, { apiKey: TEST_KEY, purpose: 'text', fetchImpl: fetchMock }),
    );
    expect(error.kind).toBe('bad-request');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [400, 'INVALID_ARGUMENT', 'API key not valid. Please pass a valid API key.', 'API_KEY_INVALID', 'invalid-key'],
    [403, 'PERMISSION_DENIED', 'Method doesn’t allow unregistered callers.', undefined, 'permission'],
    [404, 'NOT_FOUND', 'models/gemini-0 is not found', undefined, 'model-not-found'],
    [429, 'RESOURCE_EXHAUSTED', 'Quota exceeded', undefined, 'quota'],
    [400, 'INVALID_ARGUMENT', 'Unsupported thinking level minimal', undefined, 'bad-request'],
  ] as const)('maps HTTP %i %s to "%s"', async (status, statusText, message, reason, kind) => {
    const fetchMock = mockFetch(jsonResponse(googleError(status, statusText, message, reason), status));
    const error = await failure(createInteraction(request, { apiKey: TEST_KEY, purpose: 'text', fetchImpl: fetchMock }));
    expect(error.kind).toBe(kind);
    expect(error.status).toBe(status);
    expect(error.message).not.toContain(TEST_KEY);
  });

  it('explains that image models need a paid key when images hit a quota', async () => {
    const fetchMock = mockFetch(jsonResponse(googleError(429, 'RESOURCE_EXHAUSTED', 'limit: 0'), 429));
    const error = await failure(createInteraction(request, { apiKey: TEST_KEY, purpose: 'image', fetchImpl: fetchMock }));
    expect(error.kind).toBe('quota');
    expect(error.message).toMatch(/paid-tier/);
  });

  it('accepts error bodies that are not wrapped in an array', async () => {
    const fetchMock = mockFetch(
      jsonResponse({ error: { code: 404, status: 'NOT_FOUND', message: 'no such model' } }, 404),
    );
    const error = await failure(createInteraction(request, { apiKey: TEST_KEY, purpose: 'text', fetchImpl: fetchMock }));
    expect(error.kind).toBe('model-not-found');
    expect(error.detail).toBe('no such model');
  });

  it('redacts the key if Google ever echoes it back', async () => {
    const fetchMock = mockFetch(
      jsonResponse(googleError(400, 'INVALID_ARGUMENT', `Bad value for key ${TEST_KEY} in request`), 400),
    );
    const error = await failure(createInteraction(request, { apiKey: TEST_KEY, purpose: 'text', fetchImpl: fetchMock }));
    expect(error.detail).toContain('[redacted]');
    expect(error.detail).not.toContain(TEST_KEY);
  });

  it('retries once on a temporary server error, then succeeds', async () => {
    const fetchMock = mockFetch(
      jsonResponse(googleError(503, 'UNAVAILABLE', 'overloaded'), 503),
      jsonResponse(textInteraction('Recovered')),
    );
    const interaction = await createInteraction(request, {
      apiKey: TEST_KEY,
      purpose: 'text',
      fetchImpl: fetchMock,
      retryDelayMs: 1,
    });
    expect(extractText(interaction)).toBe('Recovered');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('gives up after the retry budget is spent', async () => {
    const fetchMock = mockFetch(
      jsonResponse(googleError(500, 'INTERNAL', 'boom'), 500),
      jsonResponse(googleError(500, 'INTERNAL', 'boom'), 500),
    );
    const error = await failure(
      createInteraction(request, { apiKey: TEST_KEY, purpose: 'text', fetchImpl: fetchMock, retryDelayMs: 1 }),
    );
    expect(error.kind).toBe('server');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry client errors', async () => {
    const fetchMock = mockFetch(jsonResponse(googleError(429, 'RESOURCE_EXHAUSTED', 'slow down'), 429));
    await failure(createInteraction(request, { apiKey: TEST_KEY, purpose: 'text', fetchImpl: fetchMock }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports network failures plainly', async () => {
    const fetchMock = mockFetch(new TypeError('Failed to fetch'));
    const error = await failure(createInteraction(request, { apiKey: TEST_KEY, purpose: 'text', fetchImpl: fetchMock }));
    expect(error.kind).toBe('network');
  });

  it('reports a timeout when Google is too slow', async () => {
    const fetchMock = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );
    const error = await failure(
      createInteraction(request, { apiKey: TEST_KEY, purpose: 'text', fetchImpl: fetchMock, timeoutMs: 5 }),
    );
    expect(error.kind).toBe('timeout');
  });

  it('reports cancellation when the caller aborts', async () => {
    const controller = new AbortController();
    const fetchMock = vi.fn<typeof fetch>(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );
    const pending = createInteraction(request, {
      apiKey: TEST_KEY,
      purpose: 'text',
      fetchImpl: fetchMock,
      signal: controller.signal,
    });
    controller.abort();
    const error = await failure(pending);
    expect(error.kind).toBe('aborted');
  });

  it('rejects a 200 response whose body is not JSON', async () => {
    const fetchMock = mockFetch(new Response('<html>proxy error</html>', { status: 200 }));
    const error = await failure(createInteraction(request, { apiKey: TEST_KEY, purpose: 'text', fetchImpl: fetchMock }));
    expect(error.kind).toBe('bad-response');
  });

  it('turns an incomplete interaction into a clear error', async () => {
    const fetchMock = mockFetch(jsonResponse(textInteraction('{"title":', 'incomplete')));
    const error = await failure(createInteraction(request, { apiKey: TEST_KEY, purpose: 'text', fetchImpl: fetchMock }));
    expect(error.kind).toBe('incomplete');
  });
});

describe('assertFinished', () => {
  it('passes completed interactions', () => {
    expect(() => {
      assertFinished({ status: 'completed' }, 'text');
    }).not.toThrow();
  });

  it('flags safety failures as blocked', () => {
    expect(() => {
      assertFinished({ status: 'failed', error: { message: 'Response was blocked due to safety' } }, 'image');
    }).toThrow(expect.objectContaining({ kind: 'blocked' }) as Error);
  });

  it('treats unknown states as unexpected', () => {
    expect(() => {
      assertFinished({ status: 'requires_action' }, 'text');
    }).toThrow(expect.objectContaining({ kind: 'bad-response' }) as Error);
  });
});

describe('extractText', () => {
  it('joins text from model output steps and ignores thoughts', () => {
    const interaction = {
      steps: [
        { type: 'thought', content: [{ type: 'text', text: 'thinking...' }] },
        { type: 'model_output', content: [{ type: 'text', text: '{"a":' }, { type: 'text', text: '1}' }] },
      ],
    };
    expect(extractText(interaction)).toBe('{"a":1}');
  });

  it('falls back to output_text', () => {
    expect(extractText({ output_text: 'hello' })).toBe('hello');
  });

  it('returns an empty string when there is no text', () => {
    expect(extractText({ steps: [] })).toBe('');
  });
});

describe('extractImage', () => {
  it('returns the last image from the model output', () => {
    expect(extractImage(imageInteraction(PNG_BASE64, 'image/png'))).toEqual({
      data: PNG_BASE64,
      mimeType: 'image/png',
    });
  });

  it('falls back to output_image', () => {
    expect(extractImage({ output_image: { data: 'AAAA', mime_type: 'image/jpeg' } })).toEqual({
      data: 'AAAA',
      mimeType: 'image/jpeg',
    });
  });

  it('normalises URL-safe base64', () => {
    expect(extractImage({ output_image: { data: 'ab-_', mime_type: 'image/png' } })?.data).toBe('ab+/');
  });

  it('rejects data that is not base64 and unknown mime types', () => {
    expect(extractImage({ output_image: { data: 'javascript:alert(1)' } })).toBeUndefined();
    expect(extractImage({ output_image: { data: 'AAAA', mime_type: 'text/html' } })?.mimeType).toBe('image/png');
  });

  it('returns undefined when there is no image', () => {
    expect(extractImage(textInteraction('no picture'))).toBeUndefined();
  });
});

describe('data URLs', () => {
  it('round-trips images', () => {
    const image = { data: PNG_BASE64, mimeType: 'image/png' };
    expect(fromDataUrl(toDataUrl(image))).toEqual(image);
  });

  it('rejects non-image data URLs', () => {
    expect(fromDataUrl('data:text/html;base64,PGgxPg==')).toBeUndefined();
    expect(fromDataUrl('https://example.com/a.png')).toBeUndefined();
  });
});
