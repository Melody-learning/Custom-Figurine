"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Mail, ArrowRight, Loader2, X } from "lucide-react";
import { loginWithEmail } from "@/app/actions/auth";
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
            className="relative w-full max-w-4xl overflow-hidden rounded-3xl bg-[var(--surface-sunken)] border border-white/10 shadow-2xl flex flex-col md:flex-row z-10"
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 text-white/70 hover:text-white hover:bg-black/40 transition-colors backdrop-blur-md"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Side: Image */}
            <div className="relative w-full md:w-5/12 h-48 md:h-auto overflow-hidden bg-black">
              <Image
                src="/images/after.jpg"
                alt="Custom 3D Figurine"
                fill
                className="object-cover opacity-90"
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
                        className="block w-full pl-11 pr-4 py-3.5 rounded-xl border border-white/10 bg-white/5 text-[var(--text-primary)] placeholder-[var(--text-tertiary)] hover:border-white/20 focus:bg-white/10 focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent transition-all outline-none backdrop-blur-sm disabled:opacity-50"
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
