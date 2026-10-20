/**
 * Where this build runs.
 *
 * - "byok": the static site (GitHub Pages). Visitors bring their own Gemini
 *   key, which stays in their browser.
 * - "zibby": the Zibby platform. Model calls go through Zibby's `/api/ai`
 *   proxy and are paid in the visitor's Zibby credits; no key at all.
 *
 * Fixed at build time by VITE_SCRIPTO_HOST, so the other host's code is left
 * out of each bundle.
 */
export type Host = 'byok' | 'zibby';

export const HOST: Host = import.meta.env.VITE_SCRIPTO_HOST === 'zibby' ? 'zibby' : 'byok';

/** Scripto's public page on Zibby, when one is configured for the own-key site. */
export const ZIBBY_APP_URL: string = /^https:\/\/zibby\.run\/@[\w-]+\/[\w-]+$/.test(import.meta.env.VITE_ZIBBY_URL ?? '')
  ? (import.meta.env.VITE_ZIBBY_URL ?? '')
  : '';
