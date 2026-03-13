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
      
      // Use sessionStorage so the toast only fires ONCE per browser tab session
      // This prevents the toast from firing every time they hard-refresh the page
      const hasWelcomed = sessionStorage.getItem("has_welcomed");
      
      if (!hasWelcomed) {
        // Fire the celebratory Toast on the top center/right near the coupon
        toast("Welcome Back, Creator!", {
          description: (session.user as any).hasWelcomeCoupon 
            ? "Your 10% Welcome Discount is active and ready to use." 
            : "Your portal is unlocked. Ready to shape some masterpieces?",
          icon: <Sparkles className="w-5 h-5 text-purple-500" />,
          duration: 6000,
          position: "top-right",
        });
        
        // Trigger localized confetti coming from top-right corner
        setTimeout(() => {
           import("canvas-confetti").then((confetti) => {
             confetti.default({
               particleCount: 120,
               spread: 80,
               origin: { y: 0.1, x: 0.8 },
               colors: ['#a855f7', '#ec4899', '#3b82f6'],
               disableForReducedMotion: true
             });
           });
        }, 100);
        
        // Mark as welcomed
        sessionStorage.setItem("has_welcomed", "true");
      }
    }
    
    // Auto-clear the flag if they log out, so next login it fires again
    if (status === "unauthenticated") {
       sessionStorage.removeItem("has_welcomed");
    }
  }, [status, session]);

  return <>{children}</>;
}
