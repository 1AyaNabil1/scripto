/**
 * A small in-memory limiter for the scene writer: a few storyboards a minute
 * and a day per visitor. It lives in one server instance, so it is a courtesy
 * that keeps the shared free quota fair, not a wall; Google's own quota is the
 * hard limit, and with no billing on the key a run can never cost money.
 */
export interface Limit {
  max: number;
  windowMs: number;
}

export const DEFAULT_LIMITS: readonly Limit[] = [
  { max: 3, windowMs: 60_000 },
  { max: 20, windowMs: 86_400_000 },
];

/** Past this many visitors the oldest entries are dropped, so memory stays small. */
const MAX_VISITORS = 10_000;

export interface RateLimiter {
  /** Counts one run for `visitor`, or returns the seconds to wait when a limit is reached. */
  take(visitor: string): number | null;
}

export function createRateLimiter(limits: readonly Limit[] = DEFAULT_LIMITS, now: () => number = Date.now): RateLimiter {
  const longest = Math.max(...limits.map((limit) => limit.windowMs));
  const runs = new Map<string, number[]>();

  return {
    take(visitor) {
      const at = now();
      const recent = (runs.get(visitor) ?? []).filter((t) => at - t < longest);
      for (const limit of limits) {
        const inWindow = recent.filter((t) => at - t < limit.windowMs);
        const oldest = inWindow[0];
        if (oldest !== undefined && inWindow.length >= limit.max) {
          runs.set(visitor, recent);
          return Math.max(1, Math.ceil((oldest + limit.windowMs - at) / 1000));
        }
      }
      recent.push(at);
      runs.delete(visitor);
      runs.set(visitor, recent);
      if (runs.size > MAX_VISITORS) {
        const first = runs.keys().next();
        if (!first.done) runs.delete(first.value);
      }
      return null;
    },
  };
}
