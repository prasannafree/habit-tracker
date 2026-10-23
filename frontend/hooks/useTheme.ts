/**
 * useTheme — manages theme preference (light/dark/system).
 *
 * Applies the theme by toggling a `dark` class on <html>.
 * Uses useSyncExternalStore for system preference to avoid cascading renders.
 */

'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { ThemePreference } from '@/types/settings';

function subscribeSystemTheme(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}

function getSystemThemeSnapshot(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getSystemThemeServerSnapshot(): 'light' | 'dark' {
  return 'light';
}

function applyTheme(resolvedTheme: 'light' | 'dark') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function useTheme(preference: ThemePreference): 'light' | 'dark' {
  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemThemeSnapshot,
    getSystemThemeServerSnapshot
  );

  const resolvedTheme: 'light' | 'dark' =
    preference === 'system' ? systemTheme : preference;

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme]);

  return resolvedTheme;
}
