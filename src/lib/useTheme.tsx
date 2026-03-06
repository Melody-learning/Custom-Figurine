'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTheme as useThemeStore, Theme, themeConfig } from './theme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  config: typeof themeConfig.default;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme') as Theme;
    if (saved && themeConfig[saved]) {
      setTheme(saved);
    }
  }, []);

  const config = themeConfig[theme] || themeConfig.default;

  // 防止 SSR 水合不匹配
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: 'default', setTheme: () => {}, config: themeConfig.default }}>
        <div data-theme="default" style={{}}>
          {children}
        </div>
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, config }}>
      <div
        data-theme={theme}
        style={{
          '--color-primary': config.colors.primary,
          '--color-secondary': config.colors.secondary,
          '--color-background': config.colors.background,
          '--color-background-alt': config.colors.backgroundAlt,
          '--color-accent': config.colors.accent,
          '--color-border': config.colors.border,
          '--color-text': config.colors.text,
          '--color-text-muted': config.colors.textMuted,
        } as React.CSSProperties}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useThemeConfig() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeConfig must be used within ThemeProvider');
  }
  return context;
}
