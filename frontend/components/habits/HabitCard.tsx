/**
 * HabitCard — individual card for each habit in the tracker.
 *
 * Shows habit info, progress bar, timer display, and action buttons.
 * Actions are separated from each other to prevent accidental triggering
 * (e.g. delete cannot accidentally trigger start).
 */

'use client';

import { useState } from 'react';
import { useAppContext } from '@/components/AppProvider';
import { formatElapsedTime, formatMinutes } from '@/lib/date-utils';
import type { Habit, DailyHabitRecord, CompletionStatus } from '@/types/habit';

interface HabitCardProps {
  habit: Habit;
  record: DailyHabitRecord | undefined;
}

export default function HabitCard({ habit, record }: HabitCardProps) {
  const { startHabit, pauseHabit, getElapsedMs, isRunning, deleteHabit } = useAppContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const running = isRunning(habit.id);
  const elapsedMs = getElapsedMs(habit.id);
  const targetMs = habit.targetMinutes * 60000;
  const cappedMs = Math.min(elapsedMs, targetMs);
  const remainingMs = Math.max(targetMs - cappedMs, 0);
  const progressPercent = targetMs > 0 ? Math.min((cappedMs / targetMs) * 100, 100) : 0;

  const isCompleted = record?.completionStatus === 'completed' || cappedMs >= targetMs;

  // Derive display status
  let status: CompletionStatus;
  if (isCompleted) {
    status = 'completed';
  } else if (running) {
    status = 'in_progress';
  } else if (cappedMs > 0) {
    status = 'paused';
  } else {
    status = 'not_started';
  }

  const statusConfig: Record<CompletionStatus, { label: string; color: string }> = {
    not_started: {
      label: 'Not started',
      color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    },
    in_progress: {
      label: 'In progress',
      color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
    },
    paused: {
      label: 'Paused',
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
    },
    completed: {
      label: 'Completed',
      color: 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400',
    },
  };

  const handleDelete = () => {
    deleteHabit(habit.id);
    setShowDeleteConfirm(false);
  };

  return (
    <div
      className={`rounded-xl border bg-white dark:bg-gray-900 p-5 shadow-sm transition-all duration-200 ${
        running
          ? 'border-teal-300 dark:border-teal-700 shadow-teal-50 dark:shadow-teal-950/20'
          : isCompleted
          ? 'border-teal-200 dark:border-teal-800/50'
          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
            {habit.name}
          </h3>
          {habit.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
              {habit.description}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[status].color}`}
        >
          {statusConfig[status].label}
        </span>
      </div>

      {/* Timer display */}
      <div className="flex items-baseline gap-4 mb-3">
        <span className="text-2xl font-mono font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
          {formatElapsedTime(cappedMs)}
        </span>
        <span className="text-sm text-gray-400 dark:text-gray-500">
          / {formatMinutes(habit.targetMinutes)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-2 overflow-hidden" role="progressbar" aria-valuenow={Math.round(progressPercent)} aria-valuemin={0} aria-valuemax={100} aria-label={`${habit.name} progress`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${
            isCompleted
              ? 'bg-teal-500 dark:bg-teal-400'
              : running
              ? 'bg-blue-500 dark:bg-blue-400'
              : 'bg-gray-300 dark:bg-gray-600'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
        <span>Remaining: {formatElapsedTime(remainingMs)}</span>
        <span>{Math.round(progressPercent)}%</span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isCompleted && (
            <>
              {running ? (
                <button
                  onClick={() => pauseHabit(habit.id)}
                  className="px-3.5 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-950 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  aria-label={`Pause ${habit.name}`}
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={() => startHabit(habit.id)}
                  className="px-3.5 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                  aria-label={`${cappedMs > 0 ? 'Resume' : 'Start'} ${habit.name}`}
                >
                  {cappedMs > 0 ? 'Resume' : 'Start'}
                </button>
              )}
            </>
          )}
          {isCompleted && (
            <span className="flex items-center gap-1.5 text-sm text-teal-600 dark:text-teal-400 font-medium">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Done!
            </span>
          )}
        </div>

        {/* Delete button — separated from timer actions */}
        <div>
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Delete?</span>
              <button
                onClick={handleDelete}
                className="px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-950 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Yes
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              aria-label={`Delete ${habit.name}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
