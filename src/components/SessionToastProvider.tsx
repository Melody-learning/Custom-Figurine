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
      const hasWelcomedThisSession = sessionStorage.getItem("has_welcomed_this_session");
      
      if (!hasWelcomedThisSession) {
        // 1. Standard Welcome Back Toast for all logins
        toast.success("Welcome back!", {
          duration: 3000,
          position: "top-right",
          className: "font-sans",
          style: {
            marginTop: '4rem'
          }
        });

        // 2. Extracted Top-Center Prominent Coupon Reminder
        if ((session.user as any).hasWelcomeCoupon) {
          setTimeout(() => {
            toast("10% OFF Welcome Discount Active!", {
              description: "Your exclusive discount is stored safely in your Profile vault.",
              icon: <Sparkles className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />,
              duration: 8000,
              position: "top-center",
              classNames: {
                toast: "font-sans bg-zinc-900 dark:bg-white border border-white/20 dark:border-black/20 shadow-2xl backdrop-blur-xl",
                title: "text-white dark:text-zinc-900 font-bold text-base tracking-wide",
                description: "text-zinc-300 dark:text-zinc-600 text-sm mt-0.5"
              },
              style: {
                marginTop: '1rem',
                borderRadius: '1rem'
              }
            });
          }, 300);
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
