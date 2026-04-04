'use client';

import { useState, useEffect, useCallback } from 'react';
import { TicketPercent, Plus, Power, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch } from '@/lib/admin-fetch';

interface PromoCoupon {
  id: string;
  code: string;
  title: string;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { redemptions: number };
}

export default function PromoCodesPage() {
  const [coupons, setCoupons] = useState<PromoCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await adminFetch('/api/admin/promo-codes');
      const data = await res.json();
      if (data.promoCoupons) setCoupons(data.promoCoupons);
    } catch {
      toast.error('Failed to load promo codes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code, title, discountType,
          discountValue: Number(discountValue),
          maxUses: maxUses ? Number(maxUses) : null,
          expiresAt: expiresAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error); return; }
      toast.success(`Promo code "${code}" created!`);
      setShowForm(false);
      setCode(''); setTitle(''); setDiscountValue(''); setMaxUses(''); setExpiresAt('');
      fetchCoupons();
    } catch {
      toast.error('Failed to create promo code');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const res = await adminFetch('/api/admin/promo-codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to update coupon status');
        return;
      }
      // Confirm actual DB state from response
      const actualState = data.promoCoupon?.isActive;
      if (actualState === !isActive) {
        toast.success(`Promo code ${!isActive ? 'activated' : 'deactivated'}`);
      } else {
        toast.error(`Toggle failed: DB state is still ${actualState ? 'Active' : 'Inactive'}`);
      }
      fetchCoupons();
    } catch {
      toast.error('Network error: Failed to update');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Promo Codes</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Code
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 p-6 rounded-xl border border-white/10 bg-white/[0.02] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-white/50 mb-1 font-medium">Code *</label>
              <input
                value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="KOL_JAKE_15"
                required
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white font-mono text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1 font-medium">Title *</label>
              <input
                value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Jake's Exclusive 15% Off"
                required
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1 font-medium">Discount Type *</label>
              <select
                value={discountType} onChange={e => setDiscountType(e.target.value as 'PERCENTAGE' | 'FIXED_AMOUNT')}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED_AMOUNT">Fixed Amount ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1 font-medium">Discount Value *</label>
              <input
                type="number" step="0.01" min="0"
                value={discountValue} onChange={e => setDiscountValue(e.target.value)}
                placeholder={discountType === 'PERCENTAGE' ? '15' : '10.00'}
                required
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1 font-medium">Max Uses (blank = unlimited)</label>
              <input
                type="number" min="1"
                value={maxUses} onChange={e => setMaxUses(e.target.value)}
                placeholder="100"
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1 font-medium">Expires At (blank = never)</label>
              <input
                type="datetime-local"
                value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit" disabled={submitting}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Create
            </button>
            <button
              type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2 rounded-lg border border-white/10 text-white/60 text-sm hover:text-white hover:border-white/20"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-12 text-white/30">
          <TicketPercent className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No promo codes yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.02] text-white/40 text-xs uppercase tracking-wider">
                <th className="text-left px-4 py-3 font-medium">Code</th>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Discount</th>
                <th className="text-left px-4 py-3 font-medium">Uses</th>
                <th className="text-left px-4 py-3 font-medium">Expires</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-blue-400 tracking-wider">{c.code}</td>
                  <td className="px-4 py-3 text-white">{c.title}</td>
                  <td className="px-4 py-3 text-white">
                    {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `$${c.discountValue}`}
                  </td>
                  <td className="px-4 py-3 text-white/60">
                    {c._count.redemptions}{c.maxUses !== null ? ` / ${c.maxUses}` : ''}
                  </td>
                  <td className="px-4 py-3 text-white/60">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(c.id, c.isActive)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        c.isActive
                          ? 'hover:bg-red-500/10 text-white/40 hover:text-red-400'
                          : 'hover:bg-green-500/10 text-white/40 hover:text-green-400'
                      }`}
                      title={c.isActive ? 'Deactivate' : 'Activate'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
