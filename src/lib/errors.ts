/** Errors Scripto can show to people, with plain-language messages. */

export type ErrorKind =
  | 'missing-key'
  | 'invalid-key'
  | 'permission'
  | 'quota'
  | 'model-not-found'
  | 'bad-request'
  | 'server'
  | 'network'
  | 'timeout'
  | 'aborted'
  | 'bad-response'
  | 'incomplete'
  | 'blocked'
  | 'parse'
  | 'validation'
  | 'no-image'
  | 'input';

export class ScriptoError extends Error {
  readonly kind: ErrorKind;
  readonly status: number | undefined;
  /** Extra detail from the API (already redacted), shown under the message. */
  readonly detail: string | undefined;

  constructor(kind: ErrorKind, message: string, options: { status?: number; detail?: string; cause?: unknown } = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'ScriptoError';
    this.kind = kind;
    this.status = options.status;
    this.detail = options.detail;
  }

  /** Worth retrying automatically (temporary server trouble). */
  get transient(): boolean {
    return this.kind === 'server';
  }
}

export function isScriptoError(error: unknown): error is ScriptoError {
  return error instanceof ScriptoError;
}

const MAX_DETAIL = 300;

/** Removes anything that looks like an API key and trims long messages. */
export function redact(text: string, secrets: readonly string[] = []): string {
  let out = text;
  for (const secret of secrets) {
    if (secret && secret.length >= 6) out = out.split(secret).join('[redacted]');
  }
  // Google API keys start with "AIza"; also catch long opaque tokens.
  out = out.replace(/AIza[0-9A-Za-z_-]{20,}/g, '[redacted]');
  out = out.replace(/([?&]key=)[^&\s]+/gi, '$1[redacted]');
  return out.length > MAX_DETAIL ? `${out.slice(0, MAX_DETAIL - 1)}…` : out;
}

interface GoogleErrorBody {
  code?: number;
  message?: string;
  status?: string;
  details?: { reason?: string; '@type'?: string }[];
}

/** Google returns `{error: {...}}`, sometimes wrapped in an array. */
export function readGoogleError(body: unknown): GoogleErrorBody | undefined {
  const first: unknown = Array.isArray(body) ? body[0] : body;
  if (!first || typeof first !== 'object' || !('error' in first)) return undefined;
  const error = first.error;
  if (!error || typeof error !== 'object') return undefined;
  return error;
}

export type RequestPurpose = 'text' | 'image';

/** Turns an HTTP error from the Gemini API into a ScriptoError. */
export function errorFromHttp(
  status: number,
  body: unknown,
  context: { purpose: RequestPurpose; model: string; secrets?: readonly string[] },
): ScriptoError {
  const google = readGoogleError(body);
  const rawMessage = google?.message ?? (typeof body === 'string' ? body : '');
  const detail = rawMessage ? redact(rawMessage, context.secrets) : undefined;
  const reasons = (google?.details ?? []).map((d) => d.reason ?? '').join(' ');
  const statusText = google?.status ?? '';
  const opts = { status, detail };
  const what = context.purpose === 'image' ? 'image' : 'text';

  if (/API_KEY_INVALID|API key not valid|API_KEY_EXPIRED/i.test(`${reasons} ${rawMessage}`)) {
    return new ScriptoError(
      'invalid-key',
      'Google did not accept this API key. Check that you copied the whole key from Google AI Studio, or create a new one.',
      opts,
    );
  }
  if (status === 401 || status === 403 || statusText === 'PERMISSION_DENIED' || statusText === 'UNAUTHENTICATED') {
    return new ScriptoError(
      'permission',
      'This key is not allowed to use the Gemini API. Make sure the key is restricted to the Gemini API (unrestricted keys are rejected) and that the API is enabled for its project.',
      opts,
    );
  }
  if (status === 404 || statusText === 'NOT_FOUND') {
    return new ScriptoError(
      'model-not-found',
      `The ${what} model "${context.model}" was not found or is not available to your key. Pick another model in Settings.`,
      opts,
    );
  }
  if (status === 429 || statusText === 'RESOURCE_EXHAUSTED') {
    const message =
      context.purpose === 'image'
        ? 'Image generation hit a quota limit. Gemini image models need a paid-tier key; on the free tier, turn images off in Settings and Scripto will draw placeholder frames.'
        : 'You have hit a rate or quota limit for this key. Wait a minute and try again, or check your usage in Google AI Studio.';
    return new ScriptoError('quota', message, opts);
  }
  if (status === 400 || statusText === 'INVALID_ARGUMENT' || statusText === 'FAILED_PRECONDITION') {
    if (/thinking/i.test(rawMessage)) {
      return new ScriptoError(
        'bad-request',
        `The model "${context.model}" does not accept the chosen thinking level. Pick another level (or "Model default") in Settings.`,
        opts,
      );
    }
    if (/location|region|country/i.test(rawMessage)) {
      return new ScriptoError('bad-request', 'The Gemini API is not available in your region for this key.', opts);
    }
    return new ScriptoError(
      'bad-request',
      `Google rejected the ${what} request. The model may not support this kind of request; try another model in Settings.`,
      opts,
    );
  }
  if (status >= 500) {
    return new ScriptoError('server', 'Google’s service had a temporary problem. Please try again in a moment.', opts);
  }
  return new ScriptoError('bad-response', `Unexpected response from Google (HTTP ${status}).`, opts);
}

export interface FriendlyError {
  title: string;
  message: string;
  detail?: string | undefined;
}

const TITLES: Record<ErrorKind, string> = {
  'missing-key': 'Add your Gemini API key',
  'invalid-key': 'API key not accepted',
  permission: 'Permission denied',
  quota: 'Quota reached',
  'model-not-found': 'Model not available',
  'bad-request': 'Request rejected',
  server: 'Service unavailable',
  network: 'Network problem',
  timeout: 'Request timed out',
  aborted: 'Cancelled',
  'bad-response': 'Unexpected response',
  incomplete: 'Response cut short',
  blocked: 'Blocked by safety filters',
  parse: 'Could not read the storyboard',
  validation: 'Storyboard incomplete',
  'no-image': 'No image returned',
  input: 'Check your story',
};

/** Converts any thrown value into something safe to show on screen. */
export function toFriendlyError(error: unknown): FriendlyError {
  if (isScriptoError(error)) {
    return { title: TITLES[error.kind], message: error.message, detail: error.detail };
  }
  return {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
    detail: error instanceof Error ? redact(error.message) : undefined,
  };
}
