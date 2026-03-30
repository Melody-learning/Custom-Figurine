'use client';

import Link from 'next/link';
import { ShoppingCart, UserCircle2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useTranslation } from '@/lib/useTranslation';
import Image from 'next/image';
import { AnimatedCouponBadge } from './AnimatedCouponBadge';

interface HeaderClientProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    hasWelcomeCoupon?: boolean | null;
  } | null;
}

export function HeaderClient({ user }: HeaderClientProps) {
  const { cart, setCartOpen, resetGenerationFlow } = useStore();
  const { t: translate } = useTranslation();
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const t = (key: string): string => translate(key as Parameters<typeof translate>[0]) as string;

  return (
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-md transition-colors bg-opacity-80 bg-white" style={{ borderColor: 'rgba(226, 232, 240, 0.8)' }}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" onClick={() => resetGenerationFlow()} className="text-xl font-bold text-black">
          CustomFigurine
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-gray-900 hover:opacity-70 transition-opacity">
            {t('home')}
          </Link>
          <Link 
            href="/customize" 
            onClick={() => resetGenerationFlow()} 
            className="text-sm font-medium text-gray-900 hover:opacity-70 transition-opacity"
          >
            {t('customize')}
          </Link>



          {/* Active Coupon Badge */}
          {user?.hasWelcomeCoupon && (
            <AnimatedCouponBadge accentColor="#3b82f6" />
          )}

          {/* Cart */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-2 text-sm font-medium text-gray-900 hover:opacity-70 transition-opacity cursor-pointer"
          >
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white bg-black"
              >
                {cartCount}
              </span>
            )}
          </button>

          {/* User Profile / Login */}
          <div className="pl-4 ml-2 border-l border-black/10 dark:border-white/10 flex items-center">
             {user ? (
               (() => {
                  const fallbackName = user.name || user.email?.split('@')[0] || "U";
                  const initial = fallbackName.charAt(0).toUpperCase();
                  const hasImage = !!user.image;
                  
                  return (
                    <Link href="/profile" className="relative w-8 h-8 rounded-full overflow-hidden hover:ring-2 hover:ring-[var(--brand-primary)] transition-all">
                       {hasImage ? (
                         <Image 
                            src={user.image!} 
                            alt="Profile" 
                            fill 
                            className="object-cover"
                         />
                       ) : (
                         <div className="w-full h-full bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center text-sm font-bold text-white shadow-inner">
                           {initial}
                         </div>
                       )}
                    </Link>
                  );
               })()
             ) : (
               <Link href="/login" className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-900 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <UserCircle2 className="w-4 h-4" />
                  <span>Log in</span>
               </Link>
             )}
          </div>
          
        </nav>
      </div>
    </header>
  );
}
