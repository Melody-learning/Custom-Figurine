'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedCouponBadgeProps {
  accentColor: string;
}

export function AnimatedCouponBadge({ accentColor }: AnimatedCouponBadgeProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // If the user hasn't seen the animation this session, artificially delay the entrance by 2s
    const hasSeenBadge = sessionStorage.getItem('has_seen_badge_minimal');
    
    if (!hasSeenBadge) {
      const timer = setTimeout(() => {
        setIsVisible(true);
        sessionStorage.setItem('has_seen_badge_minimal', 'true');
      }, 2000); // 2 full seconds of absolute silence before appearing
      return () => clearTimeout(timer);
    } else {
      setIsVisible(true);
    }
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ width: 0, opacity: 0, marginLeft: 0 }}
          animate={{ width: "auto", opacity: 1, marginLeft: 8 }}
          transition={{
            type: "tween",
            ease: "easeInOut",
            duration: 0.6 // Very natural, smooth sliding expansion
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
              10% OFF
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
