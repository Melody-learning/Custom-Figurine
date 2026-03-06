'use client';

import { create } from 'zustand';

export type Theme = 'default' | 'neo-brutalist' | 'minimal' | 'elegant' | 'editorial' | 'watercolor';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useTheme = create<ThemeState>((set) => ({
  theme: 'default',
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem('theme', theme);
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
  'neo-brutalist': {
    name: 'Neo-Brutalist Playful',
    colors: {
      primary: '#ff6b6b',
      secondary: '#4ecdc4',
      background: '#ffffff',
      backgroundAlt: '#ffe66d',
      accent: '#95e1d3',
      border: '#000000',
      text: '#000000',
      textMuted: '#333333',
    },
    styles: {
      button: 'border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]',
      card: 'border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]',
      section: 'bg-yellow-100',
    },
  },
  minimal: {
    name: 'Minimal',
    colors: {
      primary: '#1a1a1a',
      secondary: '#888888',
      background: '#fafafa',
      backgroundAlt: '#f0f0f0',
      accent: '#000000',
      border: '#e0e0e0',
      text: '#1a1a1a',
      textMuted: '#888888',
    },
    styles: {
      button: 'rounded-none bg-black text-white hover:bg-gray-800',
      card: 'border border-gray-200 shadow-none rounded-none',
      section: '',
    },
  },
  elegant: {
    name: 'Elegant',
    colors: {
      primary: '#1c1917',
      secondary: '#78716c',
      background: '#fafaf9',
      backgroundAlt: '#f5f5f4',
      accent: '#d4af37',
      border: '#e7e5e4',
      text: '#1c1917',
      textMuted: '#78716c',
    },
    styles: {
      button: 'rounded-full bg-amber-900 text-white hover:bg-amber-800',
      card: 'border border-stone-200 shadow-sm rounded-xl',
      section: '',
    },
  },
  editorial: {
    name: 'Editorial',
    colors: {
      primary: '#1a1a1a',
      secondary: '#666666',
      background: '#ffffff',
      backgroundAlt: '#f5f5f5',
      accent: '#2563eb',
      border: '#1a1a1a',
      text: '#1a1a1a',
      textMuted: '#666666',
    },
    styles: {
      button: 'rounded-none bg-black text-white hover:bg-gray-800 border-2 border-black',
      card: 'border border-gray-300 shadow-sm rounded-none',
      section: '',
    },
  },
  watercolor: {
    name: 'Watercolor',
    colors: {
      primary: '#c38d94',
      secondary: '#85cdca',
      background: '#faf8f5',
      backgroundAlt: '#f0ebe3',
      accent: '#78a082',
      border: '#d4c5b9',
      text: '#3a3a3a',
      textMuted: '#6b7280',
    },
    styles: {
      button: 'rounded-2xl bg-rose-300 text-white hover:bg-rose-400 shadow-md',
      card: 'border border-rose-200 shadow-md rounded-2xl',
      section: '',
    },
  },
};
