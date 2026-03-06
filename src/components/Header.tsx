'use client';

import Link from 'next/link';
import { ShoppingCart, Globe, Palette } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useTranslation } from '@/lib/useTranslation';
import { useTheme, themeConfig, Theme } from '@/lib/theme';
import { useState } from 'react';

export function Header() {
  const { cart, setCartOpen } = useStore();
  const { language, setLanguage, t: translate } = useTranslation();
  const { theme, setTheme } = useTheme();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (key: any): string => translate(key) as string;

  const themes: Theme[] = ['default', 'neo-brutalist', 'minimal', 'elegant', 'editorial', 'watercolor'];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm" style={{ borderColor: 'var(--color-border)' }}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
          CustomFigurine
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium hover:opacity-70" style={{ color: 'var(--color-text)' }}>
            {t('home')}
          </Link>
          <Link href="/customize" className="text-sm font-medium hover:opacity-70" style={{ color: 'var(--color-text)' }}>
            {t('customize')}
          </Link>

          {/* Theme Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="flex items-center gap-1 rounded-lg p-2 hover:bg-gray-100"
              style={{ color: 'var(--color-text)' }}
            >
              <Palette className="h-4 w-4" />
            </button>
            {showThemeMenu && (
              <div className="absolute right-0 mt-2 w-40 rounded-lg border bg-white shadow-lg">
                {themes.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTheme(t);
                      setShowThemeMenu(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      theme === t ? 'font-bold' : ''
                    }`}
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
            className="flex items-center gap-1 rounded-lg p-2 hover:bg-gray-100"
            style={{ color: 'var(--color-text)' }}
          >
            <Globe className="h-4 w-4" />
            <span className="text-sm font-medium">{language.toUpperCase()}</span>
          </button>

          {/* Cart */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 text-sm font-medium hover:opacity-70"
            style={{ color: 'var(--color-text)' }}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white"
                style={{ backgroundColor: 'var(--color-primary)' }}
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
