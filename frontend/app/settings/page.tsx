/**
 * Settings page (/settings) — user preferences.
 */

'use client';

import SettingsForm from '@/components/settings/SettingsForm';

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Settings
      </h1>
      <SettingsForm />
    </div>
  );
}
