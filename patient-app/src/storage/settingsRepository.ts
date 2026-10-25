import type { Db } from './migrations';

// Every key the app stores, in one place so none is invented ad hoc.
export const SETTING_KEYS = {
  // 'system' | 'en' | 'ms'. Absent means 'system' (follow the phone's language).
  language: 'language',
  // ISO timestamp of when the owner finished the first-run screen. Absent means not yet.
  onboardingCompletedAt: 'onboarding.completed_at',
} as const;

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS];

export async function getSetting(db: Db, key: SettingKey): Promise<string | null> {
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : null;
}

export async function setSetting(db: Db, key: SettingKey, value: string): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [key, value]
  );
}
