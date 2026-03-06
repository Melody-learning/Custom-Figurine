'use client';

import { I18nProvider } from '@/lib/useTranslation';
import { ThemeProvider } from '@/lib/useTheme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </I18nProvider>
  );
}
