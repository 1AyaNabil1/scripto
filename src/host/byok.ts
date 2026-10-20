/** The own-key site (GitHub Pages): Gemini with the visitor's key, nothing paid through Scripto. */
import { createGeminiBackend } from '../lib/backend';
import { KeyStatus } from './KeyStatus';
import type { HostImpl } from './types';

export const hostImpl: HostImpl = {
  host: 'byok',
  start() {
    // Nothing to set up: the site talks to Google directly.
  },
  createBackend(apiKey) {
    return createGeminiBackend({ apiKey });
  },
  Status: KeyStatus,
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
