'use client';

import { PackageOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  currency: string;
  itemCount: number;
  previewImageUrl: string | null;
  createdAt: string;
  paidAt: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING:    { label: 'Pending Payment', className: 'bg-amber-500/10 text-amber-500' },
  PROCESSING: { label: 'In Production',  className: 'bg-blue-500/10 text-blue-500' },
  SHIPPED:    { label: 'Shipped',         className: 'bg-purple-500/10 text-purple-500' },
  DELIVERED:  { label: 'Delivered',       className: 'bg-emerald-500/10 text-emerald-500' },
  CANCELLED:  { label: 'Cancelled',       className: 'bg-neutral-500/10 text-neutral-400' },
  REFUNDED:   { label: 'Refunded',        className: 'bg-red-500/10 text-red-400' },
};

export default function OrderList({ orders }: { orders: OrderSummary[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]">
          <PackageOpen className="w-5 h-5" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">My Orders</h2>
      </div>

      {orders.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-sunken)]">
          <PackageOpen className="w-6 h-6 text-[var(--text-tertiary)] mb-3 opacity-50" />
          <p className="text-[var(--text-secondary)] text-center text-sm">
            No orders yet. Create your first custom figurine and bring it to life!
          </p>
          <Link
            href="/customize"
            className="mt-4 px-6 py-2 rounded-full bg-[var(--brand-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Start Creating →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order) => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            return (
              <Link
                key={order.id}
                href={`/profile/orders/${order.id}`}
                className="group p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] flex flex-col gap-4 shadow-sm hover:border-[var(--brand-primary)]/30 hover:shadow-md transition-all duration-200"
              >
                {/* Top: Preview + Status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Preview Image */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--surface-sunken)] flex-shrink-0">
                      {order.previewImageUrl ? (
                        <img
                          src={order.previewImageUrl}
                          alt={order.orderNumber}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PackageOpen className="w-5 h-5 text-[var(--text-tertiary)] opacity-40" />
                        </div>
                      )}
                    </div>
                    {/* Order Number */}
                    <div>
                      <p className="text-sm font-mono font-medium text-[var(--text-primary)]">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  {/* Status Badge */}
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${config.className}`}>
                    {config.label}
                  </span>
                </div>

                {/* Bottom: Price + Date + Arrow */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="font-semibold text-[var(--text-primary)]">
                      ${order.totalAmount.toFixed(2)}
                    </span>
                    <span className="text-[var(--text-tertiary)] text-xs">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--brand-primary)] transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
