/**
 * AppProvider — React context that provides shared state to all pages.
 *
 * This wraps the application in the root layout and exposes:
 * - Habits state and CRUD operations
 * - Timer controls
 * - User settings
 * - Theme management
 * - Historical records for analytics
 */

'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useHabits } from '@/hooks/useHabits';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useTheme } from '@/hooks/useTheme';
import type { Habit, DailyHabitRecord, SortOption } from '@/types/habit';
import type { UserSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';
import type { TimerData } from '@/hooks/useHabitTimer';

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

  const [settings, setSettings] = useLocalStorage<UserSettings>(
    'habit-tracker-settings',
    DEFAULT_SETTINGS
  );

  const resolvedTheme = useTheme(settings.theme);

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
