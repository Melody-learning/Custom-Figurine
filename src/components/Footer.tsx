'use client';

import { useTranslation } from '@/lib/useTranslation';

export function Footer() {
  const { t: translate } = useTranslation();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (key: any): string => translate(key) as string;

  return (
    <footer className="border-t bg-white py-8">
      <div className="container mx-auto px-4 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} CustomFigurine. {t('allRightsReserved')}</p>
      </div>
    </footer>
  );
}
