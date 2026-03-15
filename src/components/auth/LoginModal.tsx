'use client';

import { useState, useEffect } from "react";
import { loginWithGoogle, loginWithEmail } from "@/app/actions/auth";
import { Mail, ArrowRight, ShieldCheck, Loader2, X } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";

export function LoginModal() {
  const { isLoginModalOpen, setLoginModalOpen } = useStore();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isLoginModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isLoginModalOpen]);

  if (!isLoginModalOpen) return null;

  async function handleEmailLogin(formData: FormData) {
    setIsLoading(true);
    try {
      const result = await loginWithEmail(formData);
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.url) {
        // Since we are in a modal, standard redirects might interrupt flow.
        // However, email magic link verification inherently redirects.
        router.push(result.url);
      } else if (result?.success) {
        toast.success("Magic link sent! Please check your email to claim the offer.");
        setLoginModalOpen(false); // Close modal on success sent
      }
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message?.includes('NEXT_REDIRECT')) {
        throw err;
      }
      console.error("Raw login error:", err);
      toast.error(err?.message || "An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
        onClick={() => setLoginModalOpen(false)}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white dark:bg-zinc-950 border border-black/10 dark:border-white/10 shadow-2xl p-8 sm:p-10 flex flex-col space-y-8 animate-in zoom-in-95 fade-in duration-300 z-10">
        
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-primary)]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {/* Close Button */}
        <button 
          onClick={() => setLoginModalOpen(false)}
          className="absolute top-4 right-4 z-20 p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
        >
           <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-3 relative z-10">
          <div className="inline-flex items-center mx-auto space-x-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-[var(--text-secondary)] text-xs font-semibold uppercase tracking-wider mb-2 relative">
             <ShieldCheck className="w-4 h-4 text-[var(--brand-primary)]" />
             <span>Secure Access Portal</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Welcome Back</h2>
          <p className="text-sm text-[var(--text-secondary)]">Log in to unlock your custom figurine pipeline</p>
        </div>

        <div className="space-y-4 relative z-10 w-full">
          {/* Google Auth Button */}
          <form action={loginWithGoogle}>
            <input type="hidden" name="callbackUrl" value={pathname} />
            <button 
              type="submit"
              className="w-full relative flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 cursor-pointer group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300 transform-origin-center" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="font-bold text-[var(--text-primary)]">Continue with Google</span>
              <div className="absolute inset-0 rounded-xl ring-2 ring-[var(--brand-primary)]/0 group-hover:ring-[var(--brand-primary)]/30 transition-all duration-300" />
            </button>
          </form>

          <div className="relative py-4 flex items-center">
            <div className="flex-grow border-t border-black/10 dark:border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Or quick link</span>
            <div className="flex-grow border-t border-black/10 dark:border-white/10"></div>
          </div>

          {/* Email Magic Link Form */}
          <form action={handleEmailLogin} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={pathname} />
            <div className="space-y-2">
              <label htmlFor="email" className="sr-only">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-[var(--text-tertiary)] group-focus-within:text-[var(--brand-primary)] transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Enter your email address..."
                  required
                  disabled={isLoading}
                  className="block w-full pl-11 pr-4 py-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] hover:border-black/20 dark:hover:border-white/20 focus:bg-black/10 dark:focus:bg-white/10 focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all outline-none disabled:opacity-50"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary)]/90 font-bold shadow-lg shadow-[var(--brand-primary)]/20 hover:shadow-[var(--brand-primary)]/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
            >
              {isLoading ? "Generating Link..." : "Send Magic Link"}
              {isLoading ? <Loader2 className="w-5 h-5 ml-1 animate-spin" /> : <ArrowRight className="w-5 h-5 ml-1" />}
            </button>
          </form>

        </div>
        
        <div className="text-center pt-2 relative z-10 mt-6">
           <p className="text-xs text-[var(--text-tertiary)]">
             By securely logging in, you agree to our <Link href="#" className="underline hover:text-[var(--text-secondary)]">Terms of Service</Link> and <Link href="#" className="underline hover:text-[var(--text-secondary)]">Privacy Policy</Link>.
           </p>
        </div>

      </div>
    </div>
  );
}
