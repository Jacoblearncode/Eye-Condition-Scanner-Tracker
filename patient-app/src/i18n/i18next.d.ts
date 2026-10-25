import type { Translations } from './locales/en';

// Makes t('some.key') a compile error when the key doesn't exist in en.ts.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: Translations };
  }
}
