/**
 * The free site (GitHub Pages): scenes from Scripto's own scene writer, which
 * holds the key, so visitors need none. Frames stay as sketches.
 */
import { SCRIPTO_API_URL } from '../lib/host';
import { forgetLegacyKey } from '../lib/settings';
import { createSiteBackend } from '../lib/siteApi';
import { FreeStatus } from './FreeStatus';
import type { HostImpl } from './types';

/** `apiUrl` is "" for a copy with no scene writer: the samples still open, but nothing can be made. */
export function createSiteHost(apiUrl: string, fetchImpl?: typeof fetch): HostImpl {
  return {
    host: 'site',
    drawsFrames: false,
    start() {
      // An earlier version kept visitors' own Gemini keys in this browser; none is needed now.
      forgetLegacyKey();
    },
    createBackend() {
      return apiUrl ? createSiteBackend({ apiUrl, ...(fetchImpl ? { fetchImpl } : {}) }) : null;
    },
    Status: FreeStatus,
    useQuote() {
      return null;
    },
    useComped() {
      return false;
    },
    topUp() {
      // Not on Zibby.
    },
    signIn() {
      // Not on Zibby.
    },
  };
}

export const hostImpl: HostImpl = createSiteHost(SCRIPTO_API_URL);
