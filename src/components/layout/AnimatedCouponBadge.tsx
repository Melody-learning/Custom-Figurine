'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedCouponBadgeProps {
  accentColor: string;
}

export function AnimatedCouponBadge({ accentColor }: AnimatedCouponBadgeProps) {
  // state: "hidden" | "awake" | "silent"
  const [badgeState, setBadgeState] = useState<"hidden" | "awake" | "silent">("hidden");

  useEffect(() => {
    const hasSeenAwake = sessionStorage.getItem('has_seen_badge_awake');
    
    if (!hasSeenAwake) {
      // 1. Initial State: Hidden (wait for a short simulate-fetch delay)
      setBadgeState("hidden");
      
      const revealTimer = setTimeout(() => {
        // 2. Awake State: Expand violently to grab attention
        setBadgeState("awake");
        sessionStorage.setItem('has_seen_badge_awake', 'true');
        
        // 3. Silent State: Calm down after 4.5 seconds
        const calmTimer = setTimeout(() => {
          setBadgeState("silent");
        }, 4500);
        
        return () => clearTimeout(calmTimer);
      }, 1000); // 1-second delay feels like the server just fetched the coupon
      
      return () => clearTimeout(revealTimer);
    } else {
      // If already seen in this session, skip straight to silent
      setBadgeState("silent");
    }
  }, []);

  const isAwake = badgeState === "awake";

  return (
    <AnimatePresence>
      {badgeState !== "hidden" && (
        <motion.div
          initial={{ width: 0, opacity: 0, scale: 0.8, marginLeft: 0 }}
          animate={{ width: "auto", opacity: 1, scale: 1, marginLeft: 8 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
            mass: 0.8
          }}
          className="relative origin-right"
        >
          <Link
            href="/profile"
            className={`hidden sm:flex relative items-center gap-1.5 px-3 py-1.5 rounded-full transition-all group overflow-hidden border ${
              isAwake 
                ? 'shadow-[0_0_15px_rgba(var(--brand-primary-rgb),0.5)] bg-black/5 dark:bg-white/5 border-2 animate-pulse' 
                : 'hover:opacity-70 border opacity-90'
            }`}
            style={{
              borderColor: accentColor,
              color: accentColor,
              whiteSpace: "nowrap"
            }}
          >
            <div 
              className={`absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,currentColor_50%,transparent_70%)] opacity-20 -translate-x-full ${
                isAwake ? 'animate-[shimmer_1.5s_infinite]' : 'animate-[shimmer_4s_infinite]'
              }`} 
            />
            
            <span className="text-xs font-bold tracking-wide flex items-center gap-1.5 z-10 w-full">
              <div 
                className={`rounded-full shadow-sm ${
                  isAwake ? 'w-2 h-2 animate-ping opacity-100' : 'w-1.5 h-1.5 animate-pulse opacity-80'
                }`} 
                style={{ backgroundColor: accentColor }} 
              />
              <motion.span
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {isAwake ? '✨ 10% OFF ACTIVE ✨' : '10% OFF'}
              </motion.span>
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
