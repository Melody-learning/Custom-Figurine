'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface AnimatedCouponBadgeProps {
  accentColor: string;
}

export function AnimatedCouponBadge({ accentColor }: AnimatedCouponBadgeProps) {
  const [isAwake, setIsAwake] = useState(false);

  useEffect(() => {
    // Check if this badge has ever been shown awake in this specific browser session
    const hasSeenAwake = sessionStorage.getItem('has_seen_badge_awake');
    
    if (!hasSeenAwake) {
      // It's the first time they see the header with a coupon in this session, wake it up!
      setIsAwake(true);
      sessionStorage.setItem('has_seen_badge_awake', 'true');
      
      // Calm back down to silent state after 5 seconds
      const timer = setTimeout(() => {
        setIsAwake(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <Link
      href="/profile"
      className={`hidden sm:flex relative items-center gap-1.5 px-3 py-1.5 rounded-full transition-all group overflow-hidden border ${
        isAwake 
          ? 'scale-110 shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.5)] bg-black/5 dark:bg-white/5 border-2 animate-pulse' 
          : 'hover:opacity-70 border opacity-90'
      }`}
      style={{
        borderColor: accentColor,
        color: accentColor
      }}
    >
      <div 
        className={`absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,currentColor_50%,transparent_70%)] opacity-20 -translate-x-full ${
          isAwake ? 'animate-[shimmer_1.5s_infinite]' : 'animate-[shimmer_4s_infinite]'
        }`} 
      />
      
      <span className="text-xs font-bold tracking-wide flex items-center gap-1.5 z-10">
        <div 
          className={`rounded-full shadow-sm ${
            isAwake ? 'w-2 h-2 animate-ping opacity-100' : 'w-1.5 h-1.5 animate-pulse opacity-80'
          }`} 
          style={{ backgroundColor: accentColor }} 
        />
        {isAwake ? '✨ 10% OFF ACTIVE ✨' : '10% OFF'}
      </span>
    </Link>
  );
}
