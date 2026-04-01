'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Extend Window type for Tawk.to
declare global {
  interface Window {
    Tawk_API?: {
      setAttributes?: (attrs: Record<string, string>, callback?: (error: unknown) => void) => void;
      onLoad?: () => void;
      customStyle?: {
        zIndex?: number;
      };
    };
    Tawk_LoadStart?: Date;
  }
}

const TAWK_PROPERTY_ID = '67049faccec6d0125df2f9b5';
const TAWK_WIDGET_ID = '1i9l0vf4j';

export function TawkToChat() {
  const { data: session } = useSession();

  useEffect(() => {
    // Delay loading to avoid impacting LCP / first paint
    const timer = setTimeout(() => {
      if (document.getElementById('tawk-script')) return;

      // Initialize Tawk_API before script loads
      window.Tawk_API = window.Tawk_API || {};
      window.Tawk_LoadStart = new Date();

      // Set z-index lower than cart sidebar (z-50) but above content
      window.Tawk_API.customStyle = {
        zIndex: 40,
      };

      const script = document.createElement('script');
      script.id = 'tawk-script';
      script.async = true;
      script.src = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
      script.charset = 'utf-8';
      script.setAttribute('crossorigin', '*');
      document.head.appendChild(script);
    }, 3000); // 3 second delay

    return () => clearTimeout(timer);
  }, []);

  // Pass logged-in user info to Tawk.to for better support context
  useEffect(() => {
    if (!session?.user) return;

    const setUserInfo = () => {
      if (window.Tawk_API?.setAttributes) {
        const attrs: Record<string, string> = {};
        if (session.user.name) attrs['name'] = session.user.name;
        if (session.user.email) attrs['email'] = session.user.email;

        window.Tawk_API.setAttributes(attrs, (error) => {
          if (error) {
            console.warn('[TawkTo] Failed to set visitor attributes:', error);
          }
        });
      }
    };

    // If Tawk is already loaded, set immediately; otherwise wait for onLoad
    if (window.Tawk_API?.setAttributes) {
      setUserInfo();
    } else {
      const prevOnLoad = window.Tawk_API?.onLoad;
      window.Tawk_API = window.Tawk_API || {};
      window.Tawk_API.onLoad = () => {
        prevOnLoad?.();
        setUserInfo();
      };
    }
  }, [session]);

  return null; // This component renders nothing, just loads the script
}
