/**
 * useHabits — central state management for habits and daily records.
 *
 * Responsibilities:
 * - CRUD operations on the habits array
 * - Managing daily habit records (historical tracking data)
 * - Timer integration (delegates to useHabitTimer)
 * - Persistence via useLocalStorage
 * - Day boundary detection via useSyncExternalStore
 *
 * Historical records snapshot the habit's name and target at tracking time,
 * so deleting or modifying a habit doesn't corrupt past analytics.
 */

'use client';

import { useState, useCallback, useMemo, useEffect, useRef, useSyncExternalStore } from 'react';
import type { Habit, DailyHabitRecord, CompletionStatus } from '@/types/habit';
import { useLocalStorage } from './useLocalStorage';
import { useHabitTimer, INITIAL_TIMER_DATA } from './useHabitTimer';
import type { TimerData } from './useHabitTimer';
import { getLocalDateKey } from '@/lib/date-utils';
import { generateId } from '@/lib/habit-utils';

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
  const [timerData, setTimerData] = useState<TimerData>(INITIAL_TIMER_DATA);

  // Sync date key safely across SSR/prerender and client without setState in effect
  const currentDateKey = useSyncExternalStore(
    subscribeToDateKey,
    getLocalDateSnapshot,
    getLocalDateServerSnapshot
  );

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

      setDailyRecords((prev) => {
        const existingIdx = prev.findIndex(
          (r) => r.dateKey === currentDateKey && r.habitId === habitId
        );

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

        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = record;
          return updated;
        } else {
          return [...prev, record];
        }
      });
    },
    [currentDateKey, habits, setDailyRecords]
  );

  // ── Day boundary detection ──
  const prevDateKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevDateKeyRef.current && prevDateKeyRef.current !== currentDateKey) {
      // Day changed! Stop timer for the previous day
      setTimerData(INITIAL_TIMER_DATA);
    }
    if (currentDateKey) {
      prevDateKeyRef.current = currentDateKey;
    }
  }, [currentDateKey]);

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
      setHabits((prev) => [...prev, newHabit]);

      // Create an initial "not_started" record for today
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

      // Remove from habits list
      setHabits((prev) => prev.filter((h) => h.id !== habitId));

      // Remove today's record for this habit (historical records are preserved)
      if (currentDateKey) {
        setDailyRecords((prev) =>
          prev.filter((r) => !(r.dateKey === currentDateKey && r.habitId === habitId))
        );
      }
    },
    [timerData.runningHabitId, setTimerData, setHabits, setDailyRecords, currentDateKey]
  );

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
