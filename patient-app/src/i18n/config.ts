import type { InitOptions } from 'i18next';
import { en } from './locales/en';
import { ms } from './locales/ms';
import { DEFAULT_LANGUAGE, type LanguageCode } from './languages';

// Shared by the app (src/i18n/index.ts) and the tests, so tests exercise the real settings.
export function buildI18nOptions(lng: LanguageCode): InitOptions {
  return {
    resources: { en: { translation: en }, ms: { translation: ms } },
    lng,
    // Any key missing from a language shows the English text, never a raw key.
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: { escapeValue: false },
    returnNull: false,
  };
}
