/**
 * Where this build runs.
 *
 * - "site": the free static site (GitHub Pages). Scenes come from Scripto's
 *   own scene writer (src/server/), which holds the Gemini key; visitors need
 *   none. Frames stay as sketches.
 * - "zibby": the Zibby platform. Model calls go through Zibby's `/api/ai`
 *   proxy and are paid in the visitor's Zibby credits; no key at all.
 *
 * Fixed at build time by VITE_SCRIPTO_HOST, so the other host's code is left
 * out of each bundle.
 */
import { parseApiUrl } from './csp';

export type Host = 'site' | 'zibby';

export const HOST: Host = import.meta.env.VITE_SCRIPTO_HOST === 'zibby' ? 'zibby' : 'site';

/** The free site's scene writer, e.g. https://scripto-api.vercel.app, or "" when this copy has none. */
export const SCRIPTO_API_URL: string = parseApiUrl(import.meta.env.VITE_SCRIPTO_API);

/** Scripto's public page on Zibby, when one is configured for the free site. */
export const ZIBBY_APP_URL: string = /^https:\/\/zibby\.run\/@[\w-]+\/[\w-]+$/.test(import.meta.env.VITE_ZIBBY_URL ?? '')
  ? (import.meta.env.VITE_ZIBBY_URL ?? '')
  : '';
