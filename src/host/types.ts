import type { ComponentType } from 'react';
import type { AiBackend } from '../lib/backend';
import type { Host } from '../lib/host';

export type QuotedAction = 'storyboard' | 'frame';

/**
 * Everything that differs between the free site and Scripto on Zibby.
 * Vite's `@host` alias picks one implementation per build, so neither bundle
 * carries the other's code.
 */
export interface HostImpl {
  readonly host: Host;
  /** False on the free site: image models are paid, so every scene keeps its sketch. */
  readonly drawsFrames: boolean;
  /** Called once from main.tsx before the app mounts. */
  start(): void;
  /** Where model calls go, or null for a copy of the free site with no scene writer. */
  createBackend(): AiBackend | null;
  /** The pill in the header: "Free", or the Zibby balance. */
  Status: ComponentType;
  /** Estimated credits for one action, or null where runs are not paid in credits. */
  useQuote(action: QuotedAction): number | null;
  /** The visitor's runs are on Zibby: show no prices. */
  useComped(): boolean;
  /** Ways out of a Zibby refusal. No-ops on the free site. */
  topUp(): void;
  signIn(): void;
}
