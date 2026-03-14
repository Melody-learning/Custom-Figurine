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
