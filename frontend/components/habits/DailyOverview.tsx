/**
 * DailyOverview — summary card at the top of the Habit Tracker page.
 *
 * Shows today's date, greeting, progress bar, and key statistics.
 */

'use client';

import { useAppContext } from '@/components/AppProvider';
import { computeDailyProgress, countCompletedHabits, totalTrackedMinutes, totalTargetMinutesFromRecords } from '@/lib/habit-utils';
import { formatMinutes, getLocalDateKey } from '@/lib/date-utils';

export default function DailyOverview() {
  const { habits, todayRecords, settings, currentDateKey } = useAppContext();

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const greeting = settings.greetingName
    ? `Hello, ${settings.greetingName}!`
    : settings.displayName
    ? `Hello, ${settings.displayName}!`
    : 'Hello!';

  const dailyProgress = computeDailyProgress(todayRecords);
  const completed = countCompletedHabits(todayRecords);
  const totalTracked = totalTrackedMinutes(todayRecords);
  const totalTarget = totalTargetMinutesFromRecords(todayRecords);
  const dailyGoal = settings.dailyGoalMinutes;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{dateStr}</p>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
            {greeting}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-teal-600 dark:text-teal-400">
            {Math.round(dailyProgress)}%
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">complete</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 mb-5 overflow-hidden" role="progressbar" aria-valuenow={Math.round(dailyProgress)} aria-valuemin={0} aria-valuemax={100} aria-label="Daily progress">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(dailyProgress, 100)}%` }}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Tracked" value={formatMinutes(Math.round(totalTracked))} />
        <StatCard label="Target" value={formatMinutes(Math.round(totalTarget))} />
        <StatCard
          label="Completed"
          value={`${completed} / ${habits.length}`}
        />
        {dailyGoal !== undefined && dailyGoal > 0 && (
          <StatCard
            label="Daily Goal"
            value={formatMinutes(dailyGoal)}
            sub={`${Math.round(Math.min((totalTracked / dailyGoal) * 100, 100))}% of goal`}
          />
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
        {value}
      </span>
      {sub && (
        <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</span>
      )}
    </div>
  );
}
