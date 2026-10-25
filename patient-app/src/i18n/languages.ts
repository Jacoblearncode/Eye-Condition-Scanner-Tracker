// Pure language logic (no React Native imports) so it can be tested in plain Node.
export const LANGUAGES = ['en', 'ms'] as const;
export type LanguageCode = (typeof LANGUAGES)[number];
export type LanguageSetting = 'system' | LanguageCode;

// Each language is named in itself, so a person can find theirs whatever the current language is.
export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: 'English',
  ms: 'Bahasa Malaysia',
};

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export function isLanguageSetting(value: unknown): value is LanguageSetting {
  return value === 'system' || (typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value));
}

// deviceLanguageCodes: the phone's preferred languages, most preferred first, as bare codes
// ('ms', 'en'). Indonesian ('id') is not treated as Malay: it is a different language.
export function resolveLanguage(setting: LanguageSetting, deviceLanguageCodes: string[]): LanguageCode {
  if (setting !== 'system') return setting;
  for (const code of deviceLanguageCodes) {
    const bare = code.toLowerCase().split(/[-_]/)[0];
    if ((LANGUAGES as readonly string[]).includes(bare)) return bare as LanguageCode;
  }
  return DEFAULT_LANGUAGE;
}
