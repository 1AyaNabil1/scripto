/**
 * Minimal client for the Gemini Interactions API
 * (POST https://generativelanguage.googleapis.com/v1beta/interactions).
 *
 * The key is sent in the x-goog-api-key header, never in the URL, and is never
 * logged. Every request sets store: false so Google does not keep the
 * interaction for later retrieval.
 */
import { GOOGLE_API_ORIGIN } from './csp';
import { errorFromHttp, redact, ScriptoError, type RequestPurpose } from './errors';
import type { InteractionRequest } from './prompts';
import { isValidModelId } from './settings';

export const INTERACTIONS_ENDPOINT = `${GOOGLE_API_ORIGIN}/v1beta/interactions`;

export interface InteractionContent {
  type: string;
  text?: string;
  data?: string;
  mime_type?: string;
}

export interface InteractionStep {
  type: string;
  content?: InteractionContent[];
}

export interface InteractionResponse {
  id?: string;
  status?: string;
  model?: string;
  steps?: InteractionStep[];
  /** Convenience fields some SDKs expose; read as a fallback only. */
  output_text?: string;
  output_image?: { data?: string; mime_type?: string };
  error?: { message?: string; code?: number | string };
}

export interface CallOptions {
  apiKey: string;
  purpose: RequestPurpose;
  signal?: AbortSignal | undefined;
  timeoutMs?: number;
  /** Extra attempts for temporary server errors (5xx). */
  retries?: number;
  retryDelayMs?: number;
  fetchImpl?: typeof fetch;
}

export const DEFAULT_TIMEOUTS: Record<RequestPurpose, number> = {
  text: 120_000,
  image: 180_000,
};

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new ScriptoError('aborted', 'Generation was cancelled.'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new ScriptoError('aborted', 'Generation was cancelled.'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => '');
  if (!text) return '';
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function sendOnce(request: InteractionRequest, options: CallOptions): Promise<InteractionResponse> {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const controller = new AbortController();
  const timeout = { fired: false };
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUTS[options.purpose];
  const timer = setTimeout(() => {
    timeout.fired = true;
    controller.abort();
  }, timeoutMs);
  const forwardAbort = () => {
    controller.abort();
  };
  options.signal?.addEventListener('abort', forwardAbort, { once: true });

  try {
    let response: Response;
    try {
      response = await fetchImpl(INTERACTIONS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': options.apiKey,
        },
        body: JSON.stringify(request),
        signal: controller.signal,
        credentials: 'omit',
        cache: 'no-store',
      });
    } catch (cause) {
      if (options.signal?.aborted) throw new ScriptoError('aborted', 'Generation was cancelled.', { cause });
      if (timeout.fired) {
        throw new ScriptoError(
          'timeout',
          `Google did not answer within ${Math.round(timeoutMs / 1000)} seconds. Try again, or choose a faster model in Settings.`,
          { cause },
        );
      }
      throw new ScriptoError(
        'network',
        'Could not reach the Gemini API. Check your internet connection, and that no extension is blocking generativelanguage.googleapis.com.',
        { cause },
      );
    }

    if (!response.ok) {
      const body = await readBody(response);
      throw errorFromHttp(response.status, body, {
        purpose: options.purpose,
        model: request.model,
        secrets: [options.apiKey],
      });
    }

    const body = await readBody(response);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ScriptoError('bad-response', 'Google sent a response Scripto could not read. Please try again.');
    }
    return body;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', forwardAbort);
  }
}

/** Sends one interaction, retrying temporary server errors with backoff. */
export async function createInteraction(
  request: InteractionRequest,
  options: CallOptions,
): Promise<InteractionResponse> {
  if (!options.apiKey.trim()) {
    throw new ScriptoError('missing-key', 'Add your Gemini API key in Settings to generate storyboards.');
  }
  if (!isValidModelId(request.model)) {
    throw new ScriptoError('bad-request', 'The model name in Settings is not valid. Use an ID such as gemini-3.8-flash.');
  }
  const retries = options.retries ?? 1;
  const baseDelay = options.retryDelayMs ?? 1500;
  for (let attempt = 0; ; attempt++) {
    try {
      const interaction = await sendOnce(request, options);
      assertFinished(interaction, options.purpose, [options.apiKey]);
      return interaction;
    } catch (error) {
      const canRetry = error instanceof ScriptoError && error.transient && attempt < retries;
      if (!canRetry) throw error;
      await wait(baseDelay * 2 ** attempt, options.signal);
    }
  }
}

/** Throws when the interaction did not complete normally. */
export function assertFinished(
  interaction: InteractionResponse,
  purpose: RequestPurpose,
  secrets: readonly string[] = [],
): void {
  const status = interaction.status ?? 'completed';
  if (status === 'completed') return;
  const detail = interaction.error?.message ? redact(interaction.error.message, secrets) : undefined;
  const safety = /safety|blocked|prohibited|policy/i.test(detail ?? '');
  if (safety) {
    throw new ScriptoError(
      'blocked',
      purpose === 'image'
        ? 'Google’s safety filters blocked this frame. Try rewording the scene.'
        : 'Google’s safety filters blocked this story. Try rewording it.',
      { detail },
    );
  }
  if (status === 'incomplete') {
    throw new ScriptoError(
      'incomplete',
      purpose === 'image'
        ? 'The image model stopped before finishing the frame. Try again.'
        : 'The model stopped before finishing the storyboard (it may have run out of output tokens). Try a shorter story or fewer scenes.',
      { detail },
    );
  }
  if (status === 'failed') {
    throw new ScriptoError('server', 'Google reported that the request failed. Please try again.', { detail });
  }
  if (status === 'cancelled') {
    throw new ScriptoError('aborted', 'The request was cancelled.', { detail });
  }
  throw new ScriptoError(
    'bad-response',
    `The request ended in an unexpected state ("${status.slice(0, 40)}"). Please try again.`,
    { detail },
  );
}

function modelOutputContents(interaction: InteractionResponse): InteractionContent[] {
  const steps = Array.isArray(interaction.steps) ? interaction.steps : [];
  return steps
    .filter((step) => step.type === 'model_output' && Array.isArray(step.content))
    .flatMap((step) => step.content ?? []);
}

/** All text the model produced, in order. */
export function extractText(interaction: InteractionResponse): string {
  const text = modelOutputContents(interaction)
    .filter((c) => c.type === 'text' && typeof c.text === 'string')
    .map((c) => c.text ?? '')
    .join('');
  if (text.trim()) return text;
  return typeof interaction.output_text === 'string' ? interaction.output_text : '';
}

export interface ExtractedImage {
  data: string;
  mimeType: string;
}

const IMAGE_MIME = /^image\/(png|jpeg|webp|gif)$/;

/** The last image the model produced, if any. */
export function extractImage(interaction: InteractionResponse): ExtractedImage | undefined {
  const images = modelOutputContents(interaction).filter(
    (c) => c.type === 'image' && typeof c.data === 'string' && c.data.length > 0,
  );
  const last = images.at(-1);
  const candidate = last
    ? { data: last.data ?? '', mimeType: last.mime_type ?? 'image/png' }
    : interaction.output_image?.data
      ? { data: interaction.output_image.data, mimeType: interaction.output_image.mime_type ?? 'image/png' }
      : undefined;
  if (!candidate) return undefined;
  const mimeType = IMAGE_MIME.test(candidate.mimeType) ? candidate.mimeType : 'image/png';
  // Normalise URL-safe base64 and whitespace, then accept only plain base64
  // so the resulting data URL cannot carry anything else.
  const data = candidate.data.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return undefined;
  return { data, mimeType };
}

export function toDataUrl(image: ExtractedImage): string {
  return `data:${image.mimeType};base64,${image.data}`;
}

/** Splits a data URL back into its parts (for style references). */
export function fromDataUrl(src: string): ExtractedImage | undefined {
  const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/.exec(src);
  if (!match?.[1] || !match[2]) return undefined;
  return { mimeType: match[1], data: match[2] };
}
