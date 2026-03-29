'use client';

import { create } from 'zustand';

export type Theme = 'default' | 'neo-brutalist' | 'minimal' | 'elegant' | 'editorial' | 'watercolor' | 'cyberpunk' | 'glassmorphism' | 'bento' | 'retro-pop' | 'zen';

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
  cyberpunk: {
    name: 'Cyberpunk 2077',
    colors: {
      primary: '#f3e600',
      secondary: '#ff003c',
      background: '#090a0f',
      backgroundAlt: '#12121c',
      accent: '#00f0ff',
      border: '#ff003c',
      text: '#e6e6e6',
      textMuted: '#8b8b8b',
    },
    styles: {
      button: 'rounded-none border-2 border-[#00f0ff] bg-transparent text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black uppercase tracking-widest font-bold shadow-[0_0_15px_rgba(0,240,255,0.5)] transition-all',
      card: 'border border-[#ff003c] bg-black shadow-[4px_4px_0_0_#ff003c] rounded-none',
      section: '',
    },
  },
  glassmorphism: {
    name: 'Glassmorphism',
    colors: {
      primary: '#ffffff',
      secondary: '#e2e8f0',
      background: '#0f172a',
      backgroundAlt: '#1e293b',
      accent: '#38bdf8',
      border: 'rgba(255, 255, 255, 0.1)',
      text: '#f8fafc',
      textMuted: '#94a3b8',
    },
    styles: {
      button: 'rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 text-white hover:bg-white/20 transition-all shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]',
      card: 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-3xl',
      section: '',
    },
  },
  bento: {
    name: 'Bento Grid',
    colors: {
      primary: '#000000',
      secondary: '#f5f5f7',
      background: '#f5f5f7',
      backgroundAlt: '#ffffff',
      accent: '#0066cc',
      border: 'transparent',
      text: '#1d1d1f',
      textMuted: '#86868b',
    },
    styles: {
      button: 'rounded-full bg-[#0071e3] text-white hover:bg-[#0077ed] transition-colors',
      card: 'bg-white rounded-[32px] shadow-[0_4px_24px_rgba(0,0,0,0.06)] border-none',
      section: '',
    },
  },
  'retro-pop': {
    name: 'Retro Pop Art',
    colors: {
      primary: '#ff3366',
      secondary: '#00c3ff',
      background: '#ffeb3b',
      backgroundAlt: '#ffffff',
      accent: '#ff9900',
      border: '#000000',
      text: '#000000',
      textMuted: '#333333',
    },
    styles: {
      button: 'rounded-none border-4 border-black bg-[#ff3366] text-white font-black uppercase hover:translate-x-1 hover:translate-y-1 hover:shadow-[0_0_0_0_rgba(0,0,0,1)] shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all',
      card: 'bg-white border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-none',
      section: '',
    },
  },
  zen: {
    name: 'Zen Minimal',
    colors: {
      primary: '#2d3748',
      secondary: '#4a5568',
      background: '#fdfbf7',
      backgroundAlt: '#f7f5f0',
      accent: '#718096',
      border: '#e2e8f0',
      text: '#1a202c',
      textMuted: '#a0aec0',
    },
    styles: {
      button: 'rounded-md bg-[#2d3748] text-white hover:bg-black font-serif tracking-wide transition-colors',
      card: 'bg-white border border-[#e2e8f0] rounded-none shadow-sm',
      section: '',
    },
  },
};
