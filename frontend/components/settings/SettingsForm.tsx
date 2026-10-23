/**
 * SettingsForm — form for user preferences.
 *
 * Includes display name, greeting name, daily goal, and theme selection.
 * Saves explicitly via a Save button with success feedback.
 * Reset-to-default with confirmation.
 */

'use client';

import { useState, useEffect } from 'react';
import { useAppContext } from '@/components/AppProvider';
import { validateDailyGoal } from '@/lib/validation';
import type { ThemePreference, UserSettings } from '@/types/settings';
import { DEFAULT_SETTINGS } from '@/types/settings';

export default function SettingsForm() {
  const { settings, setSettings } = useAppContext();

  const [displayName, setDisplayName] = useState(settings.displayName);
  const [greetingName, setGreetingName] = useState(settings.greetingName ?? '');
  const [dailyGoal, setDailyGoal] = useState(
    settings.dailyGoalMinutes?.toString() ?? ''
  );
  const [theme, setTheme] = useState<ThemePreference>(settings.theme);
  const [errors, setErrors] = useState<{ dailyGoal?: string }>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Sync form when settings change externally
  useEffect(() => {
    setDisplayName(settings.displayName);
    setGreetingName(settings.greetingName ?? '');
    setDailyGoal(settings.dailyGoalMinutes?.toString() ?? '');
    setTheme(settings.theme);
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const goalResult = validateDailyGoal(dailyGoal);
    if (!goalResult.valid) {
      setErrors({ dailyGoal: goalResult.error });
      return;
    }

    const newSettings: UserSettings = {
      displayName: displayName.trim(),
      greetingName: greetingName.trim() || undefined,
      dailyGoalMinutes: dailyGoal.trim()
        ? parseInt(dailyGoal, 10)
        : undefined,
      theme,
    };

    setSettings(newSettings);
    setErrors({});
    setSaveStatus('saved');

    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setDisplayName(DEFAULT_SETTINGS.displayName);
    setGreetingName(DEFAULT_SETTINGS.greetingName ?? '');
    setDailyGoal('');
    setTheme(DEFAULT_SETTINGS.theme);
    setShowResetConfirm(false);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Profile section */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">
          Profile
        </h2>
        <div className="space-y-4 max-w-md">
          <div>
            <label
              htmlFor="display-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Display Name
            </label>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="greeting-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Greeting Name
              <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(optional)</span>
            </label>
            <input
              id="greeting-name"
              type="text"
              value={greetingName}
              onChange={(e) => setGreetingName(e.target.value)}
              placeholder="How should we greet you?"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Used in the daily greeting on the Habit Tracker page.
            </p>
          </div>
        </div>
      </section>

      {/* Daily goal section */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Daily Goal
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Set a personal daily time goal. This is separate from the sum of your individual habit targets.
        </p>
        <div className="max-w-md">
          <label
            htmlFor="daily-goal"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
          >
            Daily Goal (minutes)
            <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(optional)</span>
          </label>
          <input
            id="daily-goal"
            type="number"
            value={dailyGoal}
            onChange={(e) => {
              setDailyGoal(e.target.value);
              if (errors.dailyGoal) setErrors({});
            }}
            placeholder="e.g. 120"
            min="1"
            className={`w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors ${
              errors.dailyGoal
                ? 'border-red-400 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            }`}
          />
          {errors.dailyGoal && (
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">{errors.dailyGoal}</p>
          )}
        </div>
      </section>

      {/* Appearance section */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">
          Appearance
        </h2>
        <fieldset>
          <legend className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Theme
          </legend>
          <div className="flex flex-wrap gap-3">
            {(
              [
                { value: 'light', label: 'Light', icon: '☀️' },
                { value: 'dark', label: 'Dark', icon: '🌙' },
                { value: 'system', label: 'System', icon: '💻' },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-all focus-within:ring-2 focus-within:ring-teal-500 ${
                  theme === opt.value
                    ? 'border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-600'
                    : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  value={opt.value}
                  checked={theme === opt.value}
                  onChange={(e) => setTheme(e.target.value as ThemePreference)}
                  className="sr-only"
                />
                <span>{opt.icon}</span>
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {showResetConfirm ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Reset all settings to defaults?
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-950 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Yes, Reset
              </button>
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-3 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
            >
              Reset to Defaults
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {saveStatus === 'saved' && (
            <span className="text-sm text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Settings saved
            </span>
          )}
          <button
            type="submit"
            className="px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
          >
            Save Settings
          </button>
        </div>
      </div>
    </form>
  );
}
