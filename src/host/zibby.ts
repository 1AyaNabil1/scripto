/**
 * Scripto on Zibby: the App Kit's host bridge, credit balance and live quotes,
 * and the proxy backend from lib/zibby.ts.
 */
import { installHostBridge, navigateHost, setMockLoader, ZIBBY_CREDITS_PATH } from '@zibby-run/app-kit';
import { useAvgActionCr, useComped } from '@zibby-run/app-kit/react';
import { createZibbyBackend } from '../lib/zibby';
import { ZIBBY_ACTIONS, ZIBBY_QUOTES } from '../lib/zibbyPayloads';
import { BalanceStatus } from './BalanceStatus';
import type { HostImpl, QuotedAction } from './types';

function useQuote(action: QuotedAction): number | null {
  const live = useAvgActionCr(ZIBBY_ACTIONS[action]);
  return live === null ? ZIBBY_QUOTES[action] : Math.max(1, Math.round(live));
}

export const hostImpl: HostImpl = {
  host: 'zibby',
  drawsFrames: true,
  start() {
    // The mock answers locally in `npm run dev:zibby`; it is not built into production.
    if (import.meta.env.DEV) {
      setMockLoader(() => import('./zibbyMock').then((m) => m.mockStream));
      const flags = window as unknown as Record<string, unknown>;
      if (flags.__zibbyAiMock === undefined) flags.__zibbyAiMock = true;
    }
    if (import.meta.env.DEV && window.parent === window) {
      void import('@zibby-run/app-kit/mock').then((m) => m.installMockHostBridge());
    } else {
      installHostBridge();
    }
  },
  createBackend() {
    return createZibbyBackend();
  },
  Status: BalanceStatus,
  useQuote,
  useComped,
  topUp() {
    navigateHost(ZIBBY_CREDITS_PATH);
  },
  signIn() {
    navigateHost('/users/log-in');
  },
};
