'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';

interface AnimatedCouponBadgeProps {
  accentColor: string;
}

export function AnimatedCouponBadge({ accentColor }: AnimatedCouponBadgeProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasCoupon, setHasCoupon] = useState(false);
  const [label, setLabel] = useState('');
  const { data: session } = useSession();

  useEffect(() => {
    // Check for any available coupon
    if (!session?.user?.id) return;

    fetch('/api/coupon/active')
      .then(res => res.json())
      .then(data => {
        if (data.coupons && data.coupons.length > 0) {
          const best = data.coupons[0];
          setHasCoupon(true);
          setLabel(
            best.discountType === 'PERCENTAGE'
              ? `${best.discountValue}% OFF`
              : `$${best.discountValue} OFF`
          );
        }
      })
      .catch(() => {});
  }, [session?.user?.id]);

  useEffect(() => {
    if (!hasCoupon) return;

    const hasSeenBadge = sessionStorage.getItem('has_seen_badge_minimal');
    
    if (!hasSeenBadge) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        sessionStorage.setItem('has_seen_badge_minimal', 'true');
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, [hasCoupon]);

  if (!hasCoupon) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ width: 0, opacity: 0, marginLeft: 0 }}
          animate={{ width: "auto", opacity: 1, marginLeft: 8 }}
          transition={{
            type: "tween",
            ease: "easeInOut",
            duration: 0.6
          }}
          className="relative origin-right overflow-hidden flex items-center"
        >
          <Link
            href="/profile"
            className="flex relative items-center gap-1.5 px-3 py-1.5 rounded-full transition-opacity hover:opacity-70 group overflow-hidden border opacity-90"
            style={{
              borderColor: accentColor,
              color: accentColor,
              whiteSpace: "nowrap"
            }}
          >
            <div 
              className="absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,currentColor_50%,transparent_70%)] opacity-20 -translate-x-full animate-[shimmer_4s_infinite]" 
            />
            
            <span className="text-xs font-bold tracking-wide flex items-center gap-1.5 z-10 w-full">
              <div 
                className="w-1.5 h-1.5 rounded-full shadow-sm animate-pulse opacity-80" 
                style={{ backgroundColor: accentColor }} 
              />
              {label}
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
