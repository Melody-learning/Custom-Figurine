'use client';

import { I18nProvider } from '@/lib/useTranslation';
import { ThemeProvider } from '@/lib/useTheme';
import { SessionProvider } from 'next-auth/react';
import { SessionToastProvider } from '@/components/SessionToastProvider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SessionToastProvider>
        <I18nProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </I18nProvider>
      </SessionToastProvider>
    </SessionProvider>
  );
}
