/**
 * useLocalStorage — persists state to localStorage with SSR safety.
 *
 * Key design decisions:
 * - Returns a default value during SSR (avoids hydration mismatches).
 * - Uses a `hasMounted` flag so the first client render uses localStorage.
 * - Treats stored data as untrusted: wraps JSON.parse in try/catch.
 * - Includes a schema version for future migrations.
 */

'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

const STORAGE_VERSION = 1;

interface StorageWrapper<T> {
  version: number;
  data: T;
}

export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize from localStorage on first render (client only)
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return defaultValue;
      const parsed: StorageWrapper<T> = JSON.parse(raw);
      if (parsed.version !== STORAGE_VERSION) {
        // Future: handle schema migrations here
        return defaultValue;
      }
      return parsed.data;
    } catch {
      return defaultValue;
    }
  });

  // Track whether we've mounted (client-side) using useSyncExternalStore to avoid setState in effect
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Persist to localStorage whenever the value changes
  useEffect(() => {
    if (!hasMounted) return;
    try {
      const wrapper: StorageWrapper<T> = {
        version: STORAGE_VERSION,
        data: storedValue,
      };
      window.localStorage.setItem(key, JSON.stringify(wrapper));
    } catch {
      // localStorage might be full or blocked
    }
  }, [key, storedValue, hasMounted]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        return next;
      });
    },
    []
  );

  // During SSR or before mount, return defaultValue to avoid hydration mismatch
  if (!hasMounted) {
    return [defaultValue, setValue];
  }

  return [storedValue, setValue];
}
