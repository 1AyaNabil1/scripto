/**
 * Content-Security-Policy for the production build.
 *
 * Scripto has no backend and no third-party scripts: everything is served from
 * its own origin, and the only network destination is Google's Generative
 * Language API. Generated frames arrive as base64 and are shown as data: URLs;
 * exports use blob: URLs.
 *
 * The policy is injected as a <meta> tag at build time only, because the Vite
 * dev server needs inline scripts for hot reloading.
 */
export const GOOGLE_API_ORIGIN = 'https://generativelanguage.googleapis.com';

export const CSP_DIRECTIVES: Readonly<Record<string, readonly string[]>> = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'", GOOGLE_API_ORIGIN],
  'media-src': ["'none'"],
  'object-src': ["'none'"],
  'frame-src': ["'none'"],
  'worker-src': ["'self'"],
  'manifest-src': ["'self'"],
  'base-uri': ["'self'"],
  'form-action': ["'none'"],
};

export function buildCsp(directives: Readonly<Record<string, readonly string[]>> = CSP_DIRECTIVES): string {
  return Object.entries(directives)
    .map(([name, values]) => `${name} ${values.join(' ')}`)
    .join('; ');
}
