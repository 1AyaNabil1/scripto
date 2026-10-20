/**
 * Content-Security-Policy for the production build.
 *
 * Scripto has no third-party scripts: everything is served from its own
 * origin, fonts included. The free site talks to one more origin, Scripto's
 * own scene writer (src/server/), and only when one is configured. The Zibby
 * build talks to nobody else at all: its model calls go to Zibby's
 * same-origin `/api/ai`. Generated frames arrive as base64 and are shown as
 * data: URLs; exports use blob: URLs.
 *
 * The policy is injected as a <meta> tag at build time only, because the Vite
 * dev server needs inline scripts for hot reloading.
 */
export type CspHost = 'site' | 'zibby';

/**
 * The scene writer's origin from VITE_SCRIPTO_API, or "" when it is missing or
 * not a plain https origin (plain http is accepted for localhost only).
 */
export function parseApiUrl(value: string | undefined): string {
  if (!value) return '';
  try {
    const url = new URL(value);
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const secure = url.protocol === 'https:' || (url.protocol === 'http:' && local);
    if (!secure || url.username || url.password || url.search || url.hash || url.pathname !== '/') return '';
    return url.origin;
  } catch {
    return '';
  }
}

export function cspDirectives(host: CspHost = 'site', apiOrigin = ''): Readonly<Record<string, readonly string[]>> {
  return {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'"],
    'connect-src': host === 'site' && apiOrigin ? ["'self'", apiOrigin] : ["'self'"],
    'media-src': ["'none'"],
    'object-src': ["'none'"],
    'frame-src': ["'none'"],
    'worker-src': ["'self'"],
    'manifest-src': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'none'"],
  };
}

export const CSP_DIRECTIVES = cspDirectives('site');

export function buildCsp(directives: Readonly<Record<string, readonly string[]>> = CSP_DIRECTIVES): string {
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');
}
