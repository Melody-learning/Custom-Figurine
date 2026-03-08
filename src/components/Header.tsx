'use client';

import Link from 'next/link';
import { ShoppingCart, Globe, Palette } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useTranslation } from '@/lib/useTranslation';
import { useThemeConfig } from '@/lib/useTheme';
import { themeConfig, Theme } from '@/lib/theme';
import { useState } from 'react';

export function Header() {
  const { cart, setCartOpen } = useStore();
  const { language, setLanguage, t: translate } = useTranslation();
  const { theme, setTheme, config } = useThemeConfig();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const t = (key: any): string => translate(key) as string;

  const themes = Object.keys(themeConfig) as Theme[];

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-md transition-colors bg-opacity-80" style={{ backgroundColor: config.colors.background, borderColor: config.colors.border }}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold" style={{ color: config.colors.primary }}>
          CustomFigurine
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: config.colors.text }}>
            {t('home')}
          </Link>
          <Link href="/customize" className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: config.colors.text }}>
            {t('customize')}
          </Link>

          {/* Theme Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center gap-1 rounded-lg p-2 hover:opacity-70 transition-opacity"
              style={{ color: config.colors.text }}
            >
              <Palette className="h-4 w-4" />
            </button>
            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-40 rounded-lg border shadow-lg overflow-hidden" style={{ backgroundColor: config.colors.background, borderColor: config.colors.border }}>
                {themes.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTheme(t);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm hover:opacity-70 transition-opacity ${
                      theme === t ? 'font-bold' : ''
                    }`}
                    style={{ color: theme === t ? config.colors.primary : config.colors.text, backgroundColor: theme === t ? config.colors.backgroundAlt : 'transparent' }}
                  >
                    {themeConfig[t].name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}
            className="flex items-center gap-1 rounded-lg p-2 hover:opacity-70 transition-opacity"
            style={{ color: config.colors.text }}
          >
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium">{language.toUpperCase()}</span>
          </button>

          {/* Cart */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: config.colors.text }}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white"
                style={{ backgroundColor: config.colors.primary }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
}
