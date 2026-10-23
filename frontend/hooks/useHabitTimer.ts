/**
 * useHabitTimer — manages timer state for habit tracking.
 *
 * Timer architecture:
 * - Stores accumulated elapsed time separately from session start timestamp.
 * - Derives actual elapsed time as: accumulated + (now - sessionStart) if running.
 * - Uses timestamp-based calculation to handle browser tab inactivity correctly.
 * - Refreshes display via setInterval but the source of truth is timestamps.
 * - Cleans up intervals on unmount to prevent memory leaks.
 * - Auto-stops timer when target duration is reached.
 * - Enforces single-timer constraint (only one habit can run at a time).
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { DailyHabitRecord, Habit } from '@/types/habit';
import { getLocalDateKey } from '@/lib/date-utils';

export interface TimerData {
  runningHabitId: string | null;
  accumulatedMs: Record<string, number>; // habitId → accumulated ms
  sessionStartedAt: number | null; // timestamp when current session started
}

const INITIAL_TIMER_DATA: TimerData = {
  runningHabitId: null,
  accumulatedMs: {},
  sessionStartedAt: null,
};

/**
 * Returns the current elapsed time in ms for a given habit,
 * combining accumulated time with the live session if running.
 */
export function getElapsedMs(habitId: string, timerData: TimerData): number {
  const accumulated = timerData.accumulatedMs[habitId] ?? 0;
  if (timerData.runningHabitId === habitId && timerData.sessionStartedAt !== null) {
    return accumulated + (Date.now() - timerData.sessionStartedAt);
  }
  return accumulated;
}

interface UseHabitTimerProps {
  habits: Habit[];
  todayRecords: DailyHabitRecord[];
  timerData: TimerData;
  setTimerData: (value: TimerData | ((prev: TimerData) => TimerData)) => void;
  onUpdateRecord: (habitId: string, elapsedMs: number, completed: boolean) => void;
  currentDateKey: string;
}

export function useHabitTimer({
  habits,
  todayRecords,
  timerData,
  setTimerData,
  onUpdateRecord,
  currentDateKey,
}: UseHabitTimerProps) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dateKeyRef = useRef(currentDateKey);

  // Keep dateKeyRef in sync
  dateKeyRef.current = currentDateKey;

  // Clear interval helper
  const clearTickInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Tick: update records with current elapsed time, check for completion
  const tick = useCallback(() => {
    if (!timerData.runningHabitId || !timerData.sessionStartedAt) return;

    // Check for date change
    const now = getLocalDateKey();
    if (now !== dateKeyRef.current) {
      // Date has changed — stop timer, finalize records for yesterday
      const habitId = timerData.runningHabitId;
      const elapsed = getElapsedMs(habitId, timerData);
      onUpdateRecord(habitId, elapsed, false);
      setTimerData({
        ...INITIAL_TIMER_DATA,
        accumulatedMs: {},
      });
      return;
    }

    const habitId = timerData.runningHabitId;
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const elapsed = getElapsedMs(habitId, timerData);
    const targetMs = habit.targetMinutes * 60000;

    if (elapsed >= targetMs) {
      // Auto-complete: cap at target
      const finalAccumulated = targetMs;
      setTimerData((prev) => ({
        ...prev,
        runningHabitId: null,
        sessionStartedAt: null,
        accumulatedMs: {
          ...prev.accumulatedMs,
          [habitId]: finalAccumulated,
        },
      }));
      onUpdateRecord(habitId, finalAccumulated, true);
    } else {
      // Update record with current elapsed
      onUpdateRecord(habitId, elapsed, false);
    }
  }, [timerData, habits, onUpdateRecord, setTimerData]);

  // Set up interval when a timer is running
  useEffect(() => {
    if (timerData.runningHabitId && timerData.sessionStartedAt) {
      clearTickInterval();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearTickInterval();
    }

    return clearTickInterval;
  }, [timerData.runningHabitId, timerData.sessionStartedAt, tick, clearTickInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTickInterval();
    };
  }, [clearTickInterval]);

  // ── Actions ──────────────────────────────────────────────────────

  const startHabit = useCallback(
    (habitId: string) => {
      const habit = habits.find((h) => h.id === habitId);
      if (!habit) return;

      // Check if already completed
      const record = todayRecords.find((r) => r.habitId === habitId);
      if (record?.completionStatus === 'completed') return;

      // If another habit is running, pause it first
      if (timerData.runningHabitId && timerData.runningHabitId !== habitId) {
        const runningId = timerData.runningHabitId;
        const runningElapsed = getElapsedMs(runningId, timerData);
        onUpdateRecord(runningId, runningElapsed, false);

        setTimerData((prev) => ({
          ...prev,
          runningHabitId: habitId,
          sessionStartedAt: Date.now(),
          accumulatedMs: {
            ...prev.accumulatedMs,
            [runningId]: runningElapsed,
            [habitId]: prev.accumulatedMs[habitId] ?? 0,
          },
        }));
      } else {
        // Start or resume this habit
        setTimerData((prev) => ({
          ...prev,
          runningHabitId: habitId,
          sessionStartedAt: Date.now(),
          accumulatedMs: {
            ...prev.accumulatedMs,
            [habitId]: prev.accumulatedMs[habitId] ?? 0,
          },
        }));
      }
    },
    [habits, todayRecords, timerData, onUpdateRecord, setTimerData]
  );

  const pauseHabit = useCallback(
    (habitId: string) => {
      if (timerData.runningHabitId !== habitId) return;

      const elapsed = getElapsedMs(habitId, timerData);
      onUpdateRecord(habitId, elapsed, false);

      setTimerData((prev) => ({
        ...prev,
        runningHabitId: null,
        sessionStartedAt: null,
        accumulatedMs: {
          ...prev.accumulatedMs,
          [habitId]: elapsed,
        },
      }));
    },
    [timerData, onUpdateRecord, setTimerData]
  );

  return {
    startHabit,
    pauseHabit,
    getElapsedMs: (habitId: string) => getElapsedMs(habitId, timerData),
    isRunning: (habitId: string) => timerData.runningHabitId === habitId,
    timerData,
  };
}

export { INITIAL_TIMER_DATA };
