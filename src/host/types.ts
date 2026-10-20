import type { ComponentType } from 'react';
import type { AiBackend } from '../lib/backend';
import type { Host } from '../lib/host';

export type QuotedAction = 'storyboard' | 'frame';

/**
 * Everything that differs between the own-key site and Scripto on Zibby.
 * Vite's `@host` alias picks one implementation per build, so neither bundle
 * carries the other's code.
 */
export interface HostImpl {
  readonly host: Host;
  /** Called once from main.tsx before the app mounts. */
  start(): void;
  /** Where model calls go. The own-key site needs the key; Zibby ignores it. */
  createBackend(apiKey: string): AiBackend;
  /** The pill in the header: the key state, or the Zibby balance. */
  Status: ComponentType<{ apiKey: string; onOpenSettings: () => void }>;
  /** Estimated credits for one action, or null where runs are not paid in credits. */
  useQuote(action: QuotedAction): number | null;
  /** The visitor's runs are on Zibby: show no prices. */
  useComped(): boolean;
  /** Ways out of a Zibby refusal. No-ops on the own-key site. */
  topUp(): void;
  signIn(): void;
}
