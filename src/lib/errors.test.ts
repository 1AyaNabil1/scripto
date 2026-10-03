import { errorFromHttp, readGoogleError, redact, ScriptoError, toFriendlyError } from './errors';

describe('redact', () => {
  it('removes known secrets and anything shaped like a Google API key', () => {
    const secret = 'my-very-secret-token';
    const text = `key=${secret} and AIzaSyA1234567890abcdefghijklmnop`;
    const out = redact(text, [secret]);
    expect(out).not.toContain(secret);
    expect(out).not.toContain('AIzaSyA1234567890');
  });

  it('redacts key query parameters', () => {
    expect(redact('https://x.test/?key=abc123&x=1')).toBe('https://x.test/?key=[redacted]&x=1');
  });

  it('truncates very long messages', () => {
    expect(redact('x'.repeat(1000)).length).toBeLessThanOrEqual(300);
  });
});

describe('readGoogleError', () => {
  it('reads both array-wrapped and plain error bodies', () => {
    const inner = { code: 400, message: 'bad', status: 'INVALID_ARGUMENT' };
    expect(readGoogleError([{ error: inner }])).toEqual(inner);
    expect(readGoogleError({ error: inner })).toEqual(inner);
    expect(readGoogleError('oops')).toBeUndefined();
    expect(readGoogleError(null)).toBeUndefined();
  });
});

describe('errorFromHttp', () => {
  const ctx = { purpose: 'text' as const, model: 'gemini-3.8-flash' };

  it('names the model when it is not found', () => {
    const error = errorFromHttp(404, {}, ctx);
    expect(error.kind).toBe('model-not-found');
    expect(error.message).toContain('gemini-3.8-flash');
  });

  it('treats 5xx as temporary', () => {
    expect(errorFromHttp(503, '', ctx).transient).toBe(true);
    expect(errorFromHttp(400, '', ctx).transient).toBe(false);
  });

  it('handles plain-text bodies', () => {
    const error = errorFromHttp(418, 'teapot', ctx);
    expect(error.kind).toBe('bad-response');
    expect(error.detail).toBe('teapot');
  });
});

describe('toFriendlyError', () => {
  it('gives a title and message for Scripto errors', () => {
    const friendly = toFriendlyError(new ScriptoError('quota', 'Slow down.', { detail: 'limit' }));
    expect(friendly).toEqual({ title: 'Quota reached', message: 'Slow down.', detail: 'limit' });
  });

  it('wraps unknown errors without leaking keys', () => {
    const friendly = toFriendlyError(new Error('failed with AIzaSyA1234567890abcdefghijklmnop'));
    expect(friendly.title).toBe('Something went wrong');
    expect(friendly.detail).toContain('[redacted]');
  });
});
