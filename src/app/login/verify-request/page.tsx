import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[var(--background)] flex items-center justify-center pt-20 pb-12 px-6">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -m-32 w-96 h-96 bg-[var(--brand-primary)]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 -m-32 w-64 h-64 bg-[var(--brand-accent)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg mx-auto">
        <div className="glass-panel p-10 sm:p-12 rounded-3xl shadow-2xl shadow-black/10 flex flex-col items-center text-center space-y-8 animate-slide-up-fade">
          
          {/* Animated Envelope Icon */}
          <div className="relative">
             <div className="absolute inset-0 bg-[var(--brand-primary)]/20 rounded-full blur-xl animate-pulse-glow" />
             <div className="relative h-20 w-20 bg-[var(--surface-raised)] border border-[var(--border-subtle)] rounded-2xl flex items-center justify-center shadow-lg transform hover:-translate-y-1 transition-transform duration-500">
               <Mail className="w-10 h-10 text-[var(--brand-primary)]" />
             </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
              Check your inbox
            </h1>
            <p className="text-[var(--text-secondary)] text-base max-w-sm mx-auto leading-relaxed">
              We&apos;ve sent a magic link to your email. Click it to securely sign in to your Modeler portal.
            </p>
          </div>

          <div className="w-full pt-6 border-t border-[var(--border-subtle)]/50">
            <Link 
              href="/login"
              className="group flex items-center justify-center gap-2 text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors duration-300 w-fit mx-auto"
            >
              <div className="p-1.5 rounded-full bg-[var(--surface-sunken)] group-hover:bg-[var(--surface-raised)] group-hover:-translate-x-1 transition-all duration-300">
                <ArrowLeft className="w-4 h-4" />
              </div>
              Back to login page
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
}
