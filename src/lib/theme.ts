'use client';

import { create } from 'zustand';

export type Theme = 'default';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useTheme = create<ThemeState>((set) => ({
  theme: 'default',
  setTheme: (theme) => {
    set({ theme });
  },
}));

// 主题配置
export const themeConfig = {
  default: {
    name: 'Default',
    colors: {
      primary: '#000000',
      secondary: '#666666',
      background: '#ffffff',
      backgroundAlt: '#f8fafc',
      accent: '#3b82f6',
      border: 'rgba(226, 232, 240, 0.8)',
      text: '#111827',
      textMuted: '#6b7280',
    },
  },
};
