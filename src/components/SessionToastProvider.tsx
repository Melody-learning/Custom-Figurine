'use client';

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export function SessionToastProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only proceed if user just successfully authenticated
    if (status === "authenticated" && session?.user) {
      
      // Check if this is the very first time they are logging in on this device
      const hasCelebrated = localStorage.getItem("has_ever_celebrated_login");
      // Use sessionStorage so the toast only fires ONCE per browser tab session
      const hasWelcomedThisSession = sessionStorage.getItem("has_welcomed_this_session");
      
      if (!hasWelcomedThisSession) {
        // Fire the celebratory Toast on the top center/right near the coupon
        toast("Welcome Back, Creator!", {
          description: (session.user as any).hasWelcomeCoupon 
            ? "Your 10% Welcome Discount is active and ready to use." 
            : "Your portal is unlocked. Ready to shape some masterpieces?",
          icon: <Sparkles className="w-5 h-5 text-purple-500" />,
          duration: 6000,
          position: "top-right",
          style: {
            marginTop: '4rem', // Push it down below the Header
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
          }
        });
        
        // Only trigger confetti if it's their FIRST time ever on this device
        if (!hasCelebrated) {
          setTimeout(() => {
             import("canvas-confetti").then((confetti) => {
               confetti.default({
                 particleCount: 40,      // Just a small pop
                 spread: 30,             // Very tight spread
                 startVelocity: 15,      // Weak explosion
                 gravity: 1.2,
                 origin: { y: 0.15, x: 0.8 }, 
                 colors: ['#FFeb3b', '#00f0ff', '#ff003c', '#00ff66'], 
                 disableForReducedMotion: true,
                 zIndex: 2000
               });
             });
          }, 300);
          localStorage.setItem("has_ever_celebrated_login", "true");
        }
        
        // Mark as welcomed for this session so we don't spam toasts on refresh
        sessionStorage.setItem("has_welcomed_this_session", "true");
      }
    }
    
    // Auto-clear the session flag if they log out, so next login it fires the plain toast again
    if (status === "unauthenticated") {
       sessionStorage.removeItem("has_welcomed_this_session");
    }
  }, [status, session]);

  return <>{children}</>;
}
