/**
 * User settings types.
 * These are frontend-only preferences stored in localStorage.
 */

export type ThemePreference = 'light' | 'dark' | 'system';

export interface UserSettings {
  displayName: string;
  greetingName?: string;
  dailyGoalMinutes?: number;
  theme: ThemePreference;
}

export const DEFAULT_SETTINGS: UserSettings = {
  displayName: '',
  greetingName: '',
  dailyGoalMinutes: undefined,
  theme: 'system',
};
