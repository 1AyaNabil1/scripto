let counter = 0;

/** Random ID for scenes and storyboards (not security-sensitive). */
export function makeId(prefix = 'id'): string {
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  counter += 1;
  return `${prefix}-${random}-${counter.toString(36)}`;
}
