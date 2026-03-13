'use client';

import { motion } from 'framer-motion';
import { Sparkles, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export function DynamicCouponCard() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('WELCOME10');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative overflow-hidden rounded-3xl p-8 sm:p-10 bg-[var(--surface-sunken)] border border-[var(--brand-primary)]/20 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 group cursor-pointer"
    >
      {/* Dynamic Animated Glow Elements bg-black */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary)]/10 via-purple-500/10 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--brand-primary)]/20 rounded-full blur-3xl pointer-events-none group-hover:bg-[var(--brand-primary)]/40 transition-colors duration-700 ease-out" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-purple-500/30 transition-colors duration-700 ease-out" />
      
      {/* Animated Racing Border */}
      <div className="absolute inset-0 pointer-events-none rounded-3xl border border-transparent [background:linear-gradient(45deg,transparent_25%,rgba(139,92,246,0.3)_50%,transparent_75%)_border-box] [background-size:200%_200%] animate-[bg-spin_3s_linear_infinite] group-hover:animate-[bg-spin_1.5s_linear_infinite]" />

      <div className="relative z-10 flex items-center gap-6 w-full md:w-auto">
        <motion.div 
           whileHover={{ rotate: 15, scale: 1.1 }}
           className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/30"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-1">
            Welcome Discount
          </h2>
          <p className="text-[var(--text-secondary)] text-sm sm:text-base font-medium">
            10% OFF carefully vaulted. Auto-applies at checkout.
          </p>
        </div>
      </div>

      <div className="relative z-10 flex-shrink-0 w-full md:w-auto">
        <div 
           onClick={handleCopy}
           className="px-6 py-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-between xl:justify-center gap-4 hover:bg-black/60 transition-colors cursor-pointer active:scale-95"
        >
          <div className="flex flex-col items-start xl:items-center">
            <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-1">Interactive Code</span>
            <div className="flex items-center gap-2 text-xl font-mono font-bold text-[var(--brand-primary)] tracking-widest text-center">
              WELCOME10
              {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[var(--text-tertiary)] hover:text-white transition-colors" />}
            </div>
          </div>
          
          <div className="h-10 w-px bg-white/10 hidden sm:block mx-2"></div>
          
          <div className="flex flex-col items-end xl:items-start pl-2 sm:pl-0">
            <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-1">Status</span>
            <span className="text-sm font-bold text-green-400 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Secured
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
