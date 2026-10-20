export const TABS = [
  { id: 'story', label: 'Story' },
  { id: 'board', label: 'Board' },
  { id: 'script', label: 'Script' },
  { id: 'arc', label: 'Arc' },
  { id: 'cast', label: 'Cast' },
] as const;

export type TabId = (typeof TABS)[number]['id'];
