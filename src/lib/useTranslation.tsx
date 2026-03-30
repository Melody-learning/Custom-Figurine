'use client';

import { createContext, useContext, ReactNode } from 'react';
import { translations } from './i18n';

interface I18nContextType {
  language: 'en';
  t: (key: keyof typeof translations.en) => string | string[] | Record<string, string>[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const t = (key: keyof typeof translations.en): string | string[] | Record<string, string>[] => {
    return translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language: 'en', t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}
