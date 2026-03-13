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
        
        // Very first login ever on this device
        if (!hasCelebrated) {
          toast("Welcome, Creator! 🎉", {
            description: (session.user as any).hasWelcomeCoupon 
              ? "Your 10% Welcome discount is now active!" 
              : "Your portal is unlocked.",
            icon: <Sparkles className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />,
            duration: 6000,
            position: "top-right",
            className: "font-sans", // Force inheriting Next.js global font
            style: {
              marginTop: '4rem',
              border: '1px solid rgba(150, 150, 150, 0.2)',
              backdropFilter: 'blur(12px)',
              background: 'var(--surface-sunken, rgba(255,255,255,0.9))'
            }
          });
          
          setTimeout(() => {
             import("canvas-confetti").then((confetti) => {
               confetti.default({
                 particleCount: 40,
                 spread: 30,
                 startVelocity: 15,
                 gravity: 1.2,
                 origin: { y: 0.15, x: 0.8 }, 
                 colors: ['#FFeb3b', '#00f0ff', '#ff003c', '#00ff66'], 
                 disableForReducedMotion: true,
                 zIndex: 2000
               });
             });
          }, 300);
          localStorage.setItem("has_ever_celebrated_login", "true");
        } else {
          // Normal, subsequent logins (No confetti, simple text)
          toast.success("Welcome back!", {
            duration: 3000,
            position: "top-right",
            className: "font-sans",
            style: {
              marginTop: '4rem'
            }
          });
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
