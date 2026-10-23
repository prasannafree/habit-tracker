/**
 * AppProvider — React context that provides shared state to all pages.
 *
 * Connects frontend components to the backend API:
 * - Habits state and CRUD operations
 * - Timer controls and cross-device sync
 * - User settings with SQLite persistence
 * - Theme management
 * - Historical records for analytics
 */

'use client';

import React, { createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTheme } from '@/hooks/useTheme';
import type { Habit, DailyHabitRecord } from '@/types/habit';
import type { UserSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';
import type { TimerData } from '@/hooks/useHabitTimer';
import { apiUpdateSettings, fetchSyncState } from '@/lib/api';

interface AppContextValue {
  // Habits
  habits: Habit[];
  todayRecords: DailyHabitRecord[];
  allRecords: DailyHabitRecord[];
  currentDateKey: string;
  addHabit: (name: string, targetMinutes: number, description?: string) => void;
  deleteHabit: (habitId: string) => void;

  // Timer
  timerData: TimerData;
  startHabit: (habitId: string) => void;
  pauseHabit: (habitId: string) => void;
  getElapsedMs: (habitId: string) => number;
  isRunning: (habitId: string) => boolean;

  // Settings
  settings: UserSettings;
  setSettings: (value: UserSettings | ((prev: UserSettings) => UserSettings)) => void;

  // Theme
  resolvedTheme: 'light' | 'dark';
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const {
    habits,
    allRecords,
    todayRecords,
    currentDateKey,
    addHabit,
    deleteHabit,
    timer,
    timerData,
  } = useHabits();

  const [settings, setSettingsState] = useLocalStorage<UserSettings>(
    'habit-tracker-settings',
    DEFAULT_SETTINGS
  );

  const resolvedTheme = useTheme(settings.theme);

  // Sync settings mutations to backend
  const setSettings = useCallback(
    (value: UserSettings | ((prev: UserSettings) => UserSettings)) => {
      setSettingsState((prev) => {
        const next = typeof value === 'function' ? value(prev) : value;
        apiUpdateSettings(next).catch((err) => {
          console.error('Failed to sync settings to server:', err);
        });
        return next;
      });
    },
    [setSettingsState]
  );

  // Poll settings sync from backend
  useEffect(() => {
    let isMounted = true;
    async function syncSettings() {
      try {
        const data = await fetchSyncState();
        if (!isMounted) return;
        if (data.settings && JSON.stringify(data.settings) !== JSON.stringify(settings)) {
          // If server has saved preferences, sync them
          if (data.settings.displayName || data.settings.dailyGoalMinutes || data.settings.theme !== 'system') {
            setSettingsState(data.settings);
          }
        }
      } catch {}
    }

    syncSettings();
    const interval = setInterval(syncSettings, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [settings, setSettingsState]);

  const value = useMemo<AppContextValue>(
    () => ({
      habits,
      todayRecords,
      allRecords,
      currentDateKey,
      addHabit,
      deleteHabit,
      timerData,
      startHabit: timer.startHabit,
      pauseHabit: timer.pauseHabit,
      getElapsedMs: timer.getElapsedMs,
      isRunning: timer.isRunning,
      settings,
      setSettings,
      resolvedTheme,
    }),
    [
      habits,
      todayRecords,
      allRecords,
      currentDateKey,
      addHabit,
      deleteHabit,
      timerData,
      timer,
      settings,
      setSettings,
      resolvedTheme,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return ctx;
}
