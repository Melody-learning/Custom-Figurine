'use client';

import { loginWithGoogle, loginWithEmail } from "@/app/actions/auth";
import { Mail, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { useState } from "react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  async function handleEmailLogin(formData: FormData) {
    setIsLoading(true);
    try {
      const result = await loginWithEmail(formData);
      if (result?.error) {
        toast.error(result.error);
      }
    } catch (err: any) {
      console.error("Raw login error:", err);
      toast.error(err?.message || "An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[var(--background)] flex items-center justify-center pt-20 pb-12 px-6">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -m-32 w-96 h-96 bg-[var(--brand-primary)]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -m-32 w-96 h-96 bg-[var(--brand-accent)]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12 lg:gap-24">
        
        {/* Left Side: Brand Imagery */}
        <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[var(--surface-sunken)] border border-[var(--border-subtle)] text-[var(--text-secondary)] text-sm font-medium">
             <ShieldCheck className="w-4 h-4 text-[var(--brand-primary)]" />
             <span>Secure Access Portal</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text-primary)]">
            Your Figures, <br className="hidden md:block"/> Formatted Forever.
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-md">
            Sign in to save your customized 3D models, track orders, and dive back into creation without losing a single detail.
          </p>
          <div className="pt-4 grid grid-cols-2 gap-4 w-full max-w-sm">
             <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]/50 flex flex-col gap-2">
                <span className="text-2xl font-bold text-[var(--brand-primary)]">∞</span>
                <span className="text-sm text-[var(--text-secondary)]">Unlimited Saves</span>
             </div>
             <div className="p-4 rounded-xl bg-[var(--surface-sunken)] border border-[var(--border-subtle)]/50 flex flex-col gap-2">
                <span className="text-2xl font-bold text-[var(--brand-accent)]">⚡</span>
                <span className="text-sm text-[var(--text-secondary)]">1-Click Checkout</span>
             </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 max-w-md">
          <div className="glass-panel p-8 sm:p-10 rounded-3xl shadow-2xl shadow-black/5 flex flex-col space-y-8 animate-slide-up-fade" style={{ animationDelay: '0.1s' }}>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">Welcome Back</h2>
              <p className="text-sm text-[var(--text-secondary)]">Log in to unlock your creative portal</p>
            </div>

            <div className="space-y-4">
              {/* Google Auth Button */}
              <form action={loginWithGoogle}>
                <button 
                  type="submit"
                  className="w-full relative flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] hover:bg-[var(--surface-raised)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[var(--brand-primary)]/10 active:scale-95 active:translate-y-0 transition-all duration-300 cursor-pointer group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-300 transform-origin-center" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="font-semibold text-[var(--text-primary)]">Continue with Google</span>
                  <div className="absolute inset-0 rounded-xl ring-2 ring-[var(--brand-primary)]/0 group-hover:ring-[var(--brand-primary)]/30 transition-all duration-300" />
                </button>
              </form>

              <div className="relative py-4 flex items-center">
                <div className="flex-grow border-t border-[var(--border-subtle)]"></div>
                <span className="flex-shrink-0 mx-4 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Or quick link</span>
                <div className="flex-grow border-t border-[var(--border-subtle)]"></div>
              </div>

              {/* Email Magic Link Form */}
              <form action={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-[var(--text-secondary)] ml-1">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-[var(--text-tertiary)] group-focus-within:text-[var(--brand-primary)] transition-colors" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      placeholder="you@example.com"
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
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary)]/90 font-semibold shadow-lg shadow-[var(--brand-primary)]/20 hover:shadow-[var(--brand-primary)]/40 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isLoading ? "Sending Magic Link..." : "Send Magic Link"}
                  {isLoading ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <ArrowRight className="w-4 h-4 ml-1" />}
                </button>
              </form>

            </div>
            
            <div className="text-center pt-2">
               <p className="text-xs text-[var(--text-tertiary)]">
                 By securely logging in, you agree to our <Link href="#" className="underline hover:text-[var(--text-secondary)]">Terms of Service</Link> and <Link href="#" className="underline hover:text-[var(--text-secondary)]">Privacy Policy</Link>.
               </p>
            </div>

          </div>
        </div>
        
      </div>
    </div>
  );
}
