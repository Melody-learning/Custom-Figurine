'use client';

import { I18nProvider } from '@/lib/useTranslation';
import { ThemeProvider } from '@/lib/useTheme';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
