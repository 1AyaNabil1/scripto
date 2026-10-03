import { useCallback, useEffect, useState } from 'react';
import { safeStorage, STORAGE_KEYS } from '../lib/settings';

export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export function loadTheme(): Theme {
  try {
    const value = safeStorage()?.getItem(STORAGE_KEYS.theme);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme;
}

/** Light/dark/system theme, remembered in localStorage. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(loadTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      const storage = safeStorage();
      if (theme === 'system') storage?.removeItem(STORAGE_KEYS.theme);
      else storage?.setItem(STORAGE_KEYS.theme, theme);
    } catch {
      // the theme still applies for this visit
    }
  }, [theme]);

  const cycle = useCallback(() => {
    setTheme((current) => THEMES[(THEMES.indexOf(current) + 1) % THEMES.length] ?? 'system');
  }, []);

  return [theme, cycle];
}
