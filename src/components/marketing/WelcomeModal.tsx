"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Mail, ArrowRight, Loader2, X } from "lucide-react";
import { loginWithGoogle, loginWithEmail } from "@/app/actions/auth";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // Function to check and show modal safely
    const triggerModal = () => {
      if (localStorage.getItem("welcome_modal_seen") !== "true") {
        setIsOpen(true);
      }
    };

    if (localStorage.getItem("welcome_modal_seen") !== "true") {
      // Show modal after 3 seconds of being on the page
      timer = setTimeout(triggerModal, 3000);

      // Exit intent trigger
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          triggerModal();
        }
      };
      document.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
  }, []);

  const closeModal = () => {
    localStorage.setItem("welcome_modal_seen", "true");
    setIsOpen(false);
  };

  async function handleClaimOffer(formData: FormData) {
    setIsLoading(true);
    try {
      const result = await loginWithEmail(formData);
      if (result?.error) {
        toast.error(result.error);
      } else if (result?.url || result?.success) {
        toast.success("Magic link sent! Please check your email to claim the offer.", {
          duration: 6000, // Show for 6 seconds
        });
        closeModal(); // UX decision: close immediately, rely on global toast
      }
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message?.includes('NEXT_REDIRECT')) {
        closeModal();
        throw err;
      }
      console.error("Raw login error:", err);
      toast.error(err?.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={closeModal}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-white dark:bg-zinc-950 border border-black/10 dark:border-white/10 shadow-2xl flex flex-col md:flex-row z-10"
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 text-white/70 hover:text-white hover:bg-black/40 transition-colors backdrop-blur-md cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side: Image */}
            <div className="relative w-full md:w-5/12 h-48 md:h-auto overflow-hidden bg-black">
              <img
                src="/images/after.jpg"
                alt="Custom 3D Figurine"
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:bg-gradient-to-r" />
              <div className="absolute bottom-6 left-6 right-6">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold mb-3">
                  ✨ Limited Time Offer
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight">Crafted for You.</h3>
              </div>
            </div>

            {/* Right Side: Content & Form */}
            <div className="w-full md:w-7/12 p-8 sm:p-10 lg:p-12 flex flex-col justify-center relative">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-primary)]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 w-full">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight mb-4">
                  Unlock <span className="text-[var(--brand-primary)]">10% Off</span> Your First Figurine
                </h2>
                <p className="text-[var(--text-secondary)] text-base mb-8">
                  Sign up now to secure your exclusive welcome discount. We'll instantly beam a magic login link to your inbox—no passwords required.
                </p>

                <form action={loginWithGoogle} className="w-full">
                  <input type="hidden" name="callbackUrl" value={typeof window !== 'undefined' ? window.location.href : '/profile'} />
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

                <div className="relative py-3 flex items-center">
                  <div className="flex-grow border-t border-black/10 dark:border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Or use email</span>
                  <div className="flex-grow border-t border-black/10 dark:border-white/10"></div>
                </div>

                <form action={handleClaimOffer} className="space-y-4">
                  <input type="hidden" name="isWelcomeModal" value="true" />
                  <input type="hidden" name="callbackUrl" value={typeof window !== 'undefined' ? window.location.href : '/profile'} />
                  
                  <div className="space-y-2">
                    <label htmlFor="modal-email" className="sr-only">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-[var(--text-tertiary)] group-focus-within:text-[var(--brand-primary)] transition-colors" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        id="modal-email"
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
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary)]/90 font-bold shadow-lg shadow-[var(--brand-primary)]/20 hover:shadow-[var(--brand-primary)]/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    {isLoading ? "Generating Link..." : "Claim Offer & Sign In"}
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-xs text-[var(--text-tertiary)]">
                    By claiming this offer, you agree to our Terms of Service. The discount code will be automatically available after your first login.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
