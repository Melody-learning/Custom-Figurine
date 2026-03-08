'use client';

import { useThemeConfig } from '@/lib/useTheme';
import DefaultHome from '@/components/home-themes/DefaultHome';
import CyberpunkHome from '@/components/home-themes/CyberpunkHome';
import GlassmorphismHome from '@/components/home-themes/GlassmorphismHome';
import BentoBoxHome from '@/components/home-themes/BentoBoxHome';
import RetroPopHome from '@/components/home-themes/RetroPopHome';
import ZenMinimalHome from '@/components/home-themes/ZenMinimalHome';

export default function Home() {
  const { theme } = useThemeConfig();

  switch (theme) {
    case 'cyberpunk':
      return <CyberpunkHome />;
    case 'glassmorphism':
      return <GlassmorphismHome />;
    case 'bento':
      return <BentoBoxHome />;
    case 'retro-pop':
      return <RetroPopHome />;
    case 'zen':
      return <ZenMinimalHome />;
    default:
      return <DefaultHome />;
  }
}
