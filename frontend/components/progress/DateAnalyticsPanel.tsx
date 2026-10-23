/**
 * DateAnalyticsPanel — shows detailed analytics for a selected date.
 *
 * Displays total tracked time, target, progress, completion counts,
 * and a per-habit breakdown.
 * Uses historical records, not today's live timer state.
 */

'use client';

import { useMemo } from 'react';
import { useAppContext } from '@/components/AppProvider';
import { getDateAnalytics } from '@/lib/analytics';
import { formatDateKey, formatElapsedTime, formatMinutes, isFutureDate } from '@/lib/date-utils';

interface DateAnalyticsPanelProps {
  dateKey: string;
}

export default function DateAnalyticsPanel({ dateKey }: DateAnalyticsPanelProps) {
  const { allRecords } = useAppContext();

  const analytics = useMemo(
    () => getDateAnalytics(dateKey, allRecords),
    [dateKey, allRecords]
  );

  if (isFutureDate(dateKey)) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {formatDateKey(dateKey)}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          This is a future date. No analytics available yet.
        </p>
      </div>
    );
  }

  if (analytics.records.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {formatDateKey(dateKey)}
        </h3>
        <div className="text-center py-8">
          <div className="text-3xl mb-2">📭</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No habits were tracked on this day.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
        {formatDateKey(dateKey)}
      </h3>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatBlock label="Tracked" value={formatMinutes(Math.round(analytics.totalTrackedMin))} />
        <StatBlock label="Target" value={formatMinutes(Math.round(analytics.totalTargetMin))} />
        <StatBlock label="Progress" value={`${Math.round(analytics.progressPercent)}%`} />
        <StatBlock
          label="Completed"
          value={`${analytics.completedCount} / ${analytics.records.length}`}
        />
      </div>

      {/* Per-habit breakdown */}
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
        Habit Breakdown
      </h4>
      <div className="space-y-3">
        {analytics.records.map((record) => {
          const trackedMin = record.elapsedMs / 60000;
          const creditedMin = Math.min(trackedMin, record.targetMinutesSnapshot);
          const percent =
            record.targetMinutesSnapshot > 0
              ? Math.min((creditedMin / record.targetMinutesSnapshot) * 100, 100)
              : 0;
          const isCompleted = record.completionStatus === 'completed';

          return (
            <div
              key={record.habitId}
              className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {record.habitNameSnapshot}
                  </span>
                  {isCompleted && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-teal-500 dark:text-teal-400 shrink-0"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCompleted
                        ? 'bg-teal-500 dark:bg-teal-400'
                        : 'bg-gray-400 dark:bg-gray-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatElapsedTime(record.elapsedMs)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  / {formatMinutes(record.targetMinutesSnapshot)} · {Math.round(percent)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-0.5">{value}</p>
    </div>
  );
}
