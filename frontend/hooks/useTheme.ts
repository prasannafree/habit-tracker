/**
 * useTheme — manages theme preference (light/dark/system).
 *
 * Applies the theme by toggling a `dark` class on <html>.
 * Persists preference in localStorage.
 * Handles system preference changes via matchMedia listener.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ThemePreference } from '@/types/settings';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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

export function useTheme(preference: ThemePreference) {
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const resolve = useCallback((pref: ThemePreference): 'light' | 'dark' => {
    if (pref === 'system') return getSystemTheme();
    return pref;
  }, []);

  // Apply on mount and whenever preference changes
  useEffect(() => {
    const resolved = resolve(preference);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [preference, resolve]);

  // Listen for system theme changes when preference is 'system'
  useEffect(() => {
    if (preference !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const resolved = e.matches ? 'dark' : 'light';
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [preference]);

  return resolvedTheme;
}
