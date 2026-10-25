import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { getDb } from '../storage/database';
import { SETTING_KEYS, getSetting, setSetting } from '../storage/settingsRepository';
import { buildI18nOptions } from './config';
import { isLanguageSetting, resolveLanguage, type LanguageSetting } from './languages';

function deviceLanguageCodes(): string[] {
  try {
    return getLocales().map((l) => l.languageCode ?? '');
  } catch {
    return [];
  }
}

export async function loadLanguageSetting(): Promise<LanguageSetting> {
  try {
    const stored = await getSetting(await getDb(), SETTING_KEYS.language);
    return isLanguageSetting(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

// Called once before the first screen renders. Never throws: a broken settings store must not
// stop the app showing emergency text, so it falls back to the phone's language / English.
export async function initI18n(): Promise<void> {
  const setting = await loadLanguageSetting();
  await i18n.use(initReactI18next).init(buildI18nOptions(resolveLanguage(setting, deviceLanguageCodes())));
}

// Applies a language immediately and remembers it on the phone.
export async function setLanguageSetting(setting: LanguageSetting): Promise<void> {
  await i18n.changeLanguage(resolveLanguage(setting, deviceLanguageCodes()));
  try {
    await setSetting(await getDb(), SETTING_KEYS.language, setting);
  } catch (err) {
    console.warn('Could not save the language choice; it will reset next launch:', err);
  }
}
