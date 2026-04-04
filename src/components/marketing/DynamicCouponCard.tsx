'use client';

import { motion } from 'framer-motion';
import { Sparkles, Copy, Check, Tag, TicketPercent } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { WELCOME_COUPON } from '@/lib/constants/coupon';
import { toast } from 'sonner';

interface ActiveCoupon {
  id: string;
  code: string;
  title: string;
  discountType: string;
  discountValue: number;
  source: 'WELCOME' | 'KOL';
}

export function DynamicCouponCard() {
  const [copied, setCopied] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<ActiveCoupon[]>([]);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await fetch('/api/coupon/active');
      const data = await res.json();
      if (data.coupons) setCoupons(data.coupons);
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchCoupons();
    } else {
      setLoading(false);
    }
  }, [session?.user?.id, fetchCoupons]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setIsRedeeming(true);
    try {
      const res = await fetch('/api/coupon/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to redeem coupon');
        return;
      }
      toast.success(`Coupon "${data.coupon.title}" redeemed successfully!`);
      setRedeemCode('');
      fetchCoupons();
    } catch {
      toast.error('Failed to redeem coupon. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  const welcomeCoupon = coupons.find(c => c.source === 'WELCOME');
  const kolCoupons = coupons.filter(c => c.source === 'KOL');
  const hasWelcomeCoupon = !!welcomeCoupon;


  if (loading) {
    return (
      <div className="rounded-3xl p-8 bg-[var(--surface-sunken)] border border-white/5 animate-pulse">
        <div className="h-20" />
      </div>
    );
  }

  // No active coupons at all
  const noCouponsAtAll = coupons.length === 0;

  return (
    <div className="space-y-4">
      {/* Welcome Coupon Card — only show when active */}
      {hasWelcomeCoupon && (
        <motion.div
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative overflow-hidden rounded-3xl p-7 sm:p-8 bg-[var(--surface-sunken)] border border-[var(--brand-primary)]/20 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary)]/10 via-purple-500/10 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--brand-primary)]/20 rounded-full blur-3xl pointer-events-none group-hover:bg-[var(--brand-primary)]/40 transition-colors duration-700 ease-out" />

          <div className="relative z-10 flex items-center gap-5 w-full md:w-auto">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-[var(--brand-primary)] to-purple-600 shadow-[var(--brand-primary)]/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-0.5">
                Welcome Discount
              </h2>
              <p className="text-[var(--text-secondary)] text-sm font-medium">
                {WELCOME_COUPON.VALUE}% OFF — Auto-applies at checkout
              </p>
            </div>
          </div>

          <div className="relative z-10 flex-shrink-0 w-full md:w-auto">
            <div
              onClick={() => handleCopy(WELCOME_COUPON.CODE)}
              className="px-5 py-3 rounded-xl border bg-black/40 border-white/10 hover:bg-black/60 cursor-pointer active:scale-95 backdrop-blur-md flex items-center gap-4 transition-colors"
            >
              <div>
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold block mb-0.5">Code</span>
                <span className="text-lg font-mono font-bold tracking-widest text-[var(--brand-primary)]">
                  {WELCOME_COUPON.CODE}
                </span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex flex-col items-center">
                {copied === WELCOME_COUPON.CODE
                  ? <Check className="w-4 h-4 text-green-400" />
                  : <Copy className="w-4 h-4 text-[var(--text-tertiary)]" />
                }
                <span className="text-[9px] text-[var(--text-tertiary)] mt-0.5">
                  {copied === WELCOME_COUPON.CODE ? 'Copied' : 'Copy'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* KOL Coupon Cards */}
      {kolCoupons.map((coupon) => (
        <motion.div
          key={coupon.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-5 bg-[var(--surface-sunken)] border border-emerald-500/20 shadow-lg flex items-center justify-between gap-4"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <TicketPercent className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{coupon.title}</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {coupon.discountType === 'PERCENTAGE'
                  ? `${coupon.discountValue}% OFF`
                  : `$${coupon.discountValue} OFF`}
                {' · Auto-applies at checkout'}
              </p>
            </div>
          </div>
          <div className="relative z-10">
            <div
              onClick={() => handleCopy(coupon.code)}
              className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 cursor-pointer hover:bg-black/60 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="font-mono font-bold text-emerald-400 tracking-wider text-sm">{coupon.code}</span>
              {copied === coupon.code ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-[var(--text-tertiary)]" />}
            </div>
          </div>
        </motion.div>
      ))}

      {/* Empty state — no active coupons */}
      {noCouponsAtAll && (
        <div className="rounded-2xl p-6 bg-[var(--surface-sunken)] border border-white/5 text-center">
          <TicketPercent className="w-10 h-10 mx-auto mb-2 text-[var(--text-tertiary)] opacity-40" />
          <p className="text-sm text-[var(--text-secondary)]">No active coupons. Redeem a promo code below!</p>
        </div>
      )}

      {/* Redeem Code Input — always visible */}
      <div className="rounded-2xl p-5 bg-[var(--surface-sunken)] border border-white/5">
        <div className="flex items-center gap-2 mb-2.5">
          <Tag className="w-4 h-4 text-[var(--text-secondary)]" />
          <h3 className="text-sm font-semibold text-white">Redeem a Promo Code</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
            placeholder="Enter code..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-black/30 border border-white/10 text-white placeholder:text-gray-500 font-mono tracking-wider focus:outline-none focus:border-[var(--brand-primary)]/50 transition-colors"
          />
          <button
            onClick={handleRedeem}
            disabled={isRedeeming || !redeemCode.trim()}
            className="px-5 py-2.5 rounded-xl bg-[var(--brand-primary)] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isRedeeming ? '...' : 'Redeem'}
          </button>
        </div>
      </div>
    </div>
  );
}
