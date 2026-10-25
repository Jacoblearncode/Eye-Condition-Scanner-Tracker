import { useEffect, useState, type ReactNode } from 'react';
import { initI18n } from '../i18n';

// Holds back the first screen until the saved language is loaded, so text never flashes in
// the wrong language.
export function I18nGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    initI18n()
      .catch((err) => console.warn('i18n init failed, using defaults:', err))
      .finally(() => setReady(true));
  }, []);
  return ready ? <>{children}</> : null;
}
