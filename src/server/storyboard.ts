/**
 * Scripto's free scene writer: the one server piece of the free site. It holds
 * the Gemini key so visitors need none.
 *
 * It takes only a story, a scene count and a look, builds the storyboard
 * request itself and returns the model's JSON. The key can do nothing else
 * through it: no other model, no other prompt, no images. The key belongs to
 * a project with no billing, so it runs on Google's free tier and can never
 * cost money; the worst abuse can do is use up the day's free quota.
 *
 * Google's terms allow the free tier only for apps that are not offered to
 * people in the EEA, Switzerland or the UK, so requests from there are turned
 * away. Bundled for Vercel by `npm run build:proxy` (see proxy/).
 */
import { createGeminiBackend } from '../lib/backend';
import { isScriptoError, type ErrorKind } from '../lib/errors';
import { defaultSettings, isValidModelId, type Settings } from '../lib/settings';
import type { SiteErrorBody, SiteErrorKind, StoryboardBody } from '../lib/siteApi';
import { getStyle, VISUAL_STYLES } from '../lib/styles';
import { MAX_SCENES, MAX_STORY_CHARS, MIN_SCENES, MIN_STORY_CHARS, type SceneCountChoice } from '../lib/types';
import { createRateLimiter, type RateLimiter } from './rateLimit';

export const DEFAULT_ORIGINS: readonly string[] = ['https://moviconexus.me'];

/** EU and EEA members (with the EU regions that have their own country codes), Switzerland and the UK. */
export const PAID_ONLY_COUNTRIES: ReadonlySet<string> = new Set(
  (
    'AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE ' +
    'AX GF GP MQ RE YT MF IS LI NO CH GB'
  ).split(' '),
);

/** 12,000 characters, even if every one is escaped, fit well inside this. */
const MAX_BODY_BYTES = 128_000;

export interface HandlerConfig {
  apiKey: string;
  /** A Gemini text model with a free tier; defaults to Scripto's usual one. */
  model?: string | undefined;
  allowedOrigins?: readonly string[] | undefined;
  fetchImpl?: typeof fetch | undefined;
  limiter?: RateLimiter | undefined;
  /** The whole request, including one retry, must finish inside the function's time limit. */
  deadlineMs?: number | undefined;
  log?: ((line: string) => void) | undefined;
}

function parseBody(raw: unknown): StoryboardBody | null {
  if (!raw || typeof raw !== 'object') return null;
  const { story, sceneCount, styleId } = raw as Record<string, unknown>;
  if (typeof story !== 'string') return null;
  const length = story.trim().length;
  if (length < MIN_STORY_CHARS || length > MAX_STORY_CHARS) return null;
  const count: SceneCountChoice | null =
    sceneCount === 'auto'
      ? 'auto'
      : typeof sceneCount === 'number' && Number.isInteger(sceneCount) && sceneCount >= MIN_SCENES && sceneCount <= MAX_SCENES
        ? sceneCount
        : null;
  if (count === null) return null;
  if (typeof styleId !== 'string' || !VISUAL_STYLES.some((style) => style.id === styleId)) return null;
  return { story, sceneCount: count, styleId };
}

async function readJson(request: Request): Promise<unknown> {
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY_BYTES) return undefined;
  const text = await request.text().catch(() => '');
  if (!text || text.length > MAX_BODY_BYTES) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/** Vercel sets these from the connection itself, so a visitor cannot pick their own. */
function visitorOf(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return request.headers.get('x-real-ip') ?? (forwarded || 'unknown');
}

function failure(kind: ErrorKind | undefined): { kind: SiteErrorKind; status: number } {
  switch (kind) {
    case 'quota':
      return { kind: 'quota', status: 429 };
    case 'blocked':
      return { kind: 'blocked', status: 422 };
    case 'incomplete':
      return { kind: 'incomplete', status: 502 };
    case 'timeout':
    case 'aborted':
      return { kind: 'timeout', status: 504 };
    default:
      // A wrong or missing key, an unknown model or Google trouble: nothing the visitor can fix.
      return { kind: 'server', status: 502 };
  }
}

export function createStoryboardHandler(config: HandlerConfig): (request: Request) => Promise<Response> {
  const origins = config.allowedOrigins ?? DEFAULT_ORIGINS;
  const limiter = config.limiter ?? createRateLimiter();
  const deadlineMs = config.deadlineMs ?? 55_000;
  const log = config.log ?? (() => undefined);
  const settings: Settings = {
    ...defaultSettings('site'),
    textModel: config.model && isValidModelId(config.model) ? config.model.trim() : defaultSettings('site').textModel,
    thinkingLevel: 'low',
  };
  const backend = createGeminiBackend({
    apiKey: config.apiKey,
    fetchImpl: config.fetchImpl,
    timeoutMs: Math.max(1, deadlineMs - 5_000),
  });

  return async (request) => {
    const origin = request.headers.get('origin') ?? '';
    const cors: Record<string, string> = origins.includes(origin)
      ? {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        }
      : {};
    const headers = { ...cors, Vary: 'Origin', 'Cache-Control': 'no-store' };
    const reply = (status: number, body: unknown, extra: Record<string, string> = {}) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8', ...extra },
      });
    const refuse = (status: number, kind: SiteErrorKind, retryAfter?: number) => {
      const body: SiteErrorBody = { error: retryAfter === undefined ? { kind } : { kind, retryAfter } };
      return reply(status, body, retryAfter === undefined ? {} : { 'Retry-After': String(retryAfter) });
    };

    // Only Scripto's own pages may use the key. Browsers always send Origin on these requests.
    if (!origins.includes(origin)) return refuse(403, 'origin');
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return refuse(405, 'input');
    if (!config.apiKey) {
      log('scene writer: GEMINI_API_KEY is not set');
      return refuse(503, 'server');
    }
    const country = (request.headers.get('x-vercel-ip-country') ?? '').toUpperCase();
    if (PAID_ONLY_COUNTRIES.has(country)) return refuse(451, 'region');

    const body = parseBody(await readJson(request));
    if (!body) return refuse(400, 'input');
    const wait = limiter.take(visitorOf(request));
    if (wait !== null) return refuse(429, 'rate', wait);

    try {
      const { text } = await backend.writeStoryboard({
        story: body.story,
        sceneCount: body.sceneCount,
        style: getStyle(body.styleId),
        settings,
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(deadlineMs)]),
      });
      return reply(200, { text });
    } catch (error) {
      const kind = isScriptoError(error) ? error.kind : undefined;
      const status = isScriptoError(error) ? error.status : undefined;
      // The kind and status only: never the story, the visitor or Google's message.
      log(`scene writer: ${kind ?? 'unexpected error'}${status ? ` (HTTP ${status})` : ''}`);
      const result = failure(kind);
      return refuse(result.status, result.kind);
    }
  };
}
