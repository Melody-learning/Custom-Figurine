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
          style: {
            marginTop: '4rem', // Push it down below the Header
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
          }
        });
        
        // Trigger localized confetti coming from top-right corner
        setTimeout(() => {
           import("canvas-confetti").then((confetti) => {
             confetti.default({
               particleCount: 150,     // Denser particles
               spread: 45,             // Tighter range
               startVelocity: 25,      // Doesn't shoot as far
               gravity: 1.2,           // Falls a bit faster
               origin: { y: 0.15, x: 0.8 }, // Spawn right at the badge
               colors: ['#FFeb3b', '#00f0ff', '#ff003c', '#00ff66'], // Brighter neon colors
               disableForReducedMotion: true,
               zIndex: 2000
             });
           });
        }, 300);
        
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
