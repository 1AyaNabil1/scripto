/**
 * The free site's backend: Scripto's own scene writer (src/server/), which
 * holds the Gemini key so visitors need none.
 *
 * The page sends only the story, the scene count and the look; the server
 * builds the request itself and returns the model's JSON, which is checked
 * here like any other answer. It writes scenes only: frames need a paid image
 * model, so on the free site every scene keeps its sketch.
 */
import type { AiBackend } from './backend';
import { ScriptoError, type ErrorKind } from './errors';
import type { SceneCountChoice } from './types';

export const STORYBOARD_PATH = '/api/storyboard';

/** What the page sends. */
export interface StoryboardBody {
  story: string;
  sceneCount: SceneCountChoice;
  styleId: string;
}

/** What the server says when it cannot write the scenes. */
export const SITE_ERROR_KINDS = [
  'input',
  'origin',
  'rate',
  'quota',
  'region',
  'blocked',
  'incomplete',
  'timeout',
  'server',
] as const;
export type SiteErrorKind = (typeof SITE_ERROR_KINDS)[number];

export interface SiteErrorBody {
  error: { kind: SiteErrorKind; retryAfter?: number };
}

/** A little longer than the server's own deadline, so its answer arrives first. */
const CLIENT_TIMEOUT_MS = 75_000;

function siteError(kind: SiteErrorKind, retryAfter: number | undefined, status: number): ScriptoError {
  const opts = { status };
  const map: Record<SiteErrorKind, [ErrorKind, string]> = {
    input: ['input', 'Scripto could not read this story. Check its length and try again.'],
    origin: ['server', 'This copy of Scripto is not allowed to use the free scene writer.'],
    rate:
      retryAfter !== undefined && retryAfter > 120
        ? ['rate', 'That is today’s free storyboards from your connection. Come back tomorrow.']
        : ['rate', 'You made a few storyboards in a row. Wait a minute, then try again.'],
    quota: [
      'quota',
      'Today’s free scenes are used up. Scripto runs on a free Google quota that every visitor shares, so try again later.',
    ],
    region: [
      'region',
      'Google’s free tier cannot be offered in the EU, the UK or Switzerland, so Scripto cannot write scenes for you here. The samples still open.',
    ],
    blocked: ['blocked', 'Google’s safety filters blocked this story. Try rewording it.'],
    incomplete: [
      'incomplete',
      'The model stopped before finishing the storyboard. Try a shorter story or fewer scenes.',
    ],
    timeout: ['timeout', 'The scene writer took too long. Try again, or ask for fewer scenes.'],
    server: ['server', 'Scripto’s scene writer is unavailable right now. Please try again in a while.'],
  };
  const [errorKind, message] = map[kind];
  return new ScriptoError(errorKind, message, opts);
}

function readError(body: unknown): SiteErrorBody['error'] | undefined {
  if (!body || typeof body !== 'object' || !('error' in body)) return undefined;
  const error = body.error;
  if (!error || typeof error !== 'object' || !('kind' in error)) return undefined;
  const kind = (SITE_ERROR_KINDS as readonly unknown[]).includes(error.kind) ? (error.kind as SiteErrorKind) : 'server';
  const retryAfter = 'retryAfter' in error && typeof error.retryAfter === 'number' ? error.retryAfter : undefined;
  return retryAfter === undefined ? { kind } : { kind, retryAfter };
}

export function createSiteBackend(options: { apiUrl: string; fetchImpl?: typeof fetch; timeoutMs?: number }): AiBackend {
  return {
    kind: 'gemini',
    async writeStoryboard(call) {
      const fetchImpl = options.fetchImpl ?? globalThis.fetch.bind(globalThis);
      const controller = new AbortController();
      const timeout = { fired: false };
      const timer = setTimeout(() => {
        timeout.fired = true;
        controller.abort();
      }, options.timeoutMs ?? CLIENT_TIMEOUT_MS);
      const forwardAbort = () => {
        controller.abort();
      };
      call.signal?.addEventListener('abort', forwardAbort, { once: true });
      const body: StoryboardBody = { story: call.story, sceneCount: call.sceneCount, styleId: call.style.id };
      try {
        let response: Response;
        try {
          response = await fetchImpl(`${options.apiUrl}${STORYBOARD_PATH}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal,
            credentials: 'omit',
            cache: 'no-store',
          });
        } catch (cause) {
          if (call.signal?.aborted) throw new ScriptoError('aborted', 'Generation was cancelled.', { cause });
          if (timeout.fired) throw siteError('timeout', undefined, 0);
          throw new ScriptoError(
            'network',
            'Could not reach Scripto’s scene writer. Check your internet connection and try again.',
            { cause },
          );
        }
        const answer: unknown = await response.json().catch(() => undefined);
        if (!response.ok) {
          const error = readError(answer);
          throw siteError(error?.kind ?? 'server', error?.retryAfter, response.status);
        }
        if (!answer || typeof answer !== 'object' || !('text' in answer) || typeof answer.text !== 'string') {
          throw new ScriptoError('bad-response', 'The scene writer sent an answer Scripto could not read. Please try again.');
        }
        return { text: answer.text };
      } finally {
        clearTimeout(timer);
        call.signal?.removeEventListener('abort', forwardAbort);
      }
    },
    drawFrame() {
      return Promise.reject(
        new ScriptoError('no-image', 'Frames are not drawn on the free site: every scene keeps its sketch.'),
      );
    },
  };
}
