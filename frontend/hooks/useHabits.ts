/**
 * useHabits — central state management for habits, records, and backend sync.
 *
 * Responsibilities:
 * - CRUD operations on habits with backend SQLite persistence
 * - Real-time cross-device synchronization (polling & visibility change sync)
 * - Automatic migration from client localStorage on first run
 * - Day boundary detection
 * - Single-timer state sync across devices
 */

'use client';

import { useState, useCallback, useMemo, useEffect, useRef, useSyncExternalStore } from 'react';
import type { Habit, DailyHabitRecord, CompletionStatus } from '@/types/habit';
import { useLocalStorage } from './useLocalStorage';
import { useHabitTimer, INITIAL_TIMER_DATA } from './useHabitTimer';
import type { TimerData } from './useHabitTimer';
import { getLocalDateKey } from '@/lib/date-utils';
import { generateId } from '@/lib/habit-utils';
import {
  fetchSyncState,
  migrateLocalStorage,
  apiAddHabit,
  apiDeleteHabit,
  apiUpsertRecord,
  apiUpdateTimer,
} from '@/lib/api';

function subscribeToDateKey(callback: () => void) {
  // Check every 10 seconds for date change
  const interval = setInterval(callback, 10000);
  return () => clearInterval(interval);
}

function getLocalDateSnapshot(): string {
  return getLocalDateKey();
}

function getLocalDateServerSnapshot(): string {
  return '';
}

export function useHabits() {
  const [habits, setHabits] = useLocalStorage<Habit[]>('habit-tracker-habits', []);
  const [dailyRecords, setDailyRecords] = useLocalStorage<DailyHabitRecord[]>(
    'habit-tracker-records',
    []
  );
  const [timerData, setTimerDataState] = useState<TimerData>(INITIAL_TIMER_DATA);

  // Sync date key safely across SSR/prerender and client without setState in effect
  const currentDateKey = useSyncExternalStore(
    subscribeToDateKey,
    getLocalDateSnapshot,
    getLocalDateServerSnapshot
  );

  // Wrapped timerData setter that also syncs state to backend
  const setTimerData = useCallback((value: TimerData | ((prev: TimerData) => TimerData)) => {
    setTimerDataState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      // Persist timer state to server asynchronously
      apiUpdateTimer(next).catch((err) => {
        console.error('Failed to sync timer state to server:', err);
      });
      return next;
    });
  }, []);

  // ── Today's records ──
  const todayRecords = useMemo(
    () => dailyRecords.filter((r) => r.dateKey === currentDateKey),
    [dailyRecords, currentDateKey]
  );

  // Active (non-archived) habits
  const activeHabits = useMemo(
    () => habits.filter((h) => !h.isArchived),
    [habits]
  );

  // ── Record management ──
  const handleUpdateRecord = useCallback(
    (habitId: string, elapsedMs: number, completed: boolean) => {
      if (!currentDateKey) return;

      const habit = habits.find((h) => h.id === habitId);
      const habitName = habit?.name ?? 'Unknown';
      const targetMin = habit?.targetMinutes ?? 0;

      const cappedMs = Math.min(elapsedMs, targetMin * 60000);

      let status: CompletionStatus;
      if (completed || cappedMs >= targetMin * 60000) {
        status = 'completed';
      } else if (cappedMs > 0) {
        status = 'in_progress';
      } else {
        status = 'not_started';
      }

      const record: DailyHabitRecord = {
        dateKey: currentDateKey,
        habitId,
        habitNameSnapshot: habitName,
        targetMinutesSnapshot: targetMin,
        elapsedMs: cappedMs,
        completionStatus: status,
        lastUpdatedAt: new Date().toISOString(),
      };

      // Optimistic local update
      setDailyRecords((prev) => {
        const existingIdx = prev.findIndex(
          (r) => r.dateKey === currentDateKey && r.habitId === habitId
        );
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = record;
          return updated;
        } else {
          return [...prev, record];
        }
      });

      // Backend sync
      apiUpsertRecord(record).catch((err) => {
        console.error('Failed to sync record to backend:', err);
      });
    },
    [currentDateKey, habits, setDailyRecords]
  );

  // ── Day boundary detection ──
  const prevDateKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevDateKeyRef.current && prevDateKeyRef.current !== currentDateKey) {
      // Day changed! Stop timer for previous day
      setTimerData(INITIAL_TIMER_DATA);
    }
    if (currentDateKey) {
      prevDateKeyRef.current = currentDateKey;
    }
  }, [currentDateKey, setTimerData]);

  // ── Tick counter to force re-renders when timer is running ──
  const [, setTick] = useState(0);
  const tickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerData.runningHabitId) {
      if (!tickIntervalRef.current) {
        tickIntervalRef.current = setInterval(() => {
          setTick((t) => t + 1);
        }, 200); // Refresh display 5x/sec for smooth counter
      }
    } else {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    }
    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, [timerData.runningHabitId]);

  // ── Timer hook ──
  const timer = useHabitTimer({
    habits: activeHabits,
    todayRecords,
    timerData,
    setTimerData,
    onUpdateRecord: handleUpdateRecord,
    currentDateKey,
  });

  // ── CRUD operations ──
  const addHabit = useCallback(
    (name: string, targetMinutes: number, description?: string) => {
      const newHabit: Habit = {
        id: generateId(),
        name: name.trim(),
        description: description?.trim() || undefined,
        targetMinutes,
        createdAt: new Date().toISOString(),
        isArchived: false,
      };

      // Optimistic update
      setHabits((prev) => [...prev, newHabit]);

      if (currentDateKey) {
        const record: DailyHabitRecord = {
          dateKey: currentDateKey,
          habitId: newHabit.id,
          habitNameSnapshot: newHabit.name,
          targetMinutesSnapshot: newHabit.targetMinutes,
          elapsedMs: 0,
          completionStatus: 'not_started',
          lastUpdatedAt: new Date().toISOString(),
        };
        setDailyRecords((prev) => [...prev, record]);
      }

      // Backend sync
      apiAddHabit(newHabit.name, newHabit.targetMinutes, newHabit.description, currentDateKey).catch(
        (err) => {
          console.error('Failed to create habit on server:', err);
        }
      );
    },
    [setHabits, setDailyRecords, currentDateKey]
  );

  const deleteHabit = useCallback(
    (habitId: string) => {
      // Stop timer if it's running for this habit
      if (timerData.runningHabitId === habitId) {
        setTimerData((prev) => ({
          ...prev,
          runningHabitId: null,
          sessionStartedAt: null,
        }));
      }

      // Optimistic removal from habits list
      setHabits((prev) => prev.filter((h) => h.id !== habitId));

      // Remove today's record for this habit
      if (currentDateKey) {
        setDailyRecords((prev) =>
          prev.filter((r) => !(r.dateKey === currentDateKey && r.habitId === habitId))
        );
      }

      // Backend sync
      apiDeleteHabit(habitId, currentDateKey).catch((err) => {
        console.error('Failed to delete habit on server:', err);
      });
    },
    [timerData.runningHabitId, setTimerData, setHabits, setDailyRecords, currentDateKey]
  );

  // ── Backend Cross-Device Synchronization Loop ──
  const isMigratedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function syncWithBackend() {
      try {
        const serverState = await fetchSyncState();
        if (!isMounted) return;

        // Auto-migration on first client load if DB is empty
        if (!isMigratedRef.current && serverState.habits.length === 0 && habits.length > 0) {
          isMigratedRef.current = true;
          const migrated = await migrateLocalStorage({
            habits,
            allRecords: dailyRecords,
          });
          if (isMounted) {
            setHabits(migrated.habits);
            setDailyRecords(migrated.allRecords);
          }
          return;
        }

        isMigratedRef.current = true;

        // Sync habits if server differs
        if (JSON.stringify(serverState.habits) !== JSON.stringify(habits)) {
          setHabits(serverState.habits);
        }

        // Sync records if server differs
        if (JSON.stringify(serverState.allRecords) !== JSON.stringify(dailyRecords)) {
          setDailyRecords(serverState.allRecords);
        }

        // Sync timer state if changed on another device
        if (
          serverState.timerData.runningHabitId !== timerData.runningHabitId ||
          serverState.timerData.sessionStartedAt !== timerData.sessionStartedAt
        ) {
          setTimerDataState(serverState.timerData);
        }
      } catch (err) {
        // Silent catch for intermittent network disconnects
        console.warn('Backend sync poll failed, retrying in next cycle:', err);
      }
    }

    // Initial sync
    syncWithBackend();

    // Poll every 2.5 seconds for cross-device updates
    const pollInterval = setInterval(syncWithBackend, 2500);

    // Sync on window focus / tab visibility
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncWithBackend();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', syncWithBackend);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', syncWithBackend);
    };
  }, [habits, dailyRecords, timerData.runningHabitId, timerData.sessionStartedAt, setHabits, setDailyRecords]);

  return {
    habits: activeHabits,
    allRecords: dailyRecords,
    todayRecords,
    currentDateKey,
    addHabit,
    deleteHabit,
    timer,
    timerData,
  };
}
