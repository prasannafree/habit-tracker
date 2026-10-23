/**
 * MonthlySummaryCard — summary statistics for the currently viewed month.
 */

'use client';

import { useMemo } from 'react';
import { useAppContext } from '@/components/AppProvider';
import { getMonthlySummary } from '@/lib/analytics';
import { formatMinutes } from '@/lib/date-utils';

interface MonthlySummaryCardProps {
  year: number;
  month: number;
}

export default function MonthlySummaryCard({ year, month }: MonthlySummaryCardProps) {
  const { allRecords } = useAppContext();

  const summary = useMemo(
    () => getMonthlySummary(year, month, allRecords),
    [year, month, allRecords]
  );

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
        Monthly Summary
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Total Tracked</span>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
            {formatMinutes(Math.round(summary.totalTrackedMin))}
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Active Days</span>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
            {summary.daysWithActivity}
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Avg. Progress</span>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
            {Math.round(summary.avgDailyProgress)}%
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Perfect Days</span>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
            {summary.fullyCompletedDays}
          </p>
        </div>
      </div>
    </div>
  );
}
