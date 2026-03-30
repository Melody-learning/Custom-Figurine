'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, CreditCard, Truck, CheckCircle2, XCircle, RotateCcw, ExternalLink, Image as ImageIcon, MessageSquare, Headphones } from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface SerializedOrderItem {
  id: string;
  orderId: string;
  variantId: string;
  title: string;
  price: number;
  quantity: number;
  size: string | null;
  originalImageUrl: string | null;
  generatedImageUrl: string | null;
  generatedAssetId: string | null;
  customInstructions: string | null;
  createdAt: string;
}

interface SerializedOrder {
  id: string;
  orderNumber: string;
  userId: string;
  status: string;
  shopifyDraftOrderId: string | null;
  shopifyOrderId: string | null;
  invoiceUrl: string | null;
  subtotalAmount: number;
  discountCode: string | null;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  trackingNumber: string | null;
  trackingUrl: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  items: SerializedOrderItem[];
}

// ============================================================
// Status Config
// ============================================================

const STATUS_STEPS = [
  { key: 'PENDING',    label: 'Created',       icon: CreditCard },
  { key: 'PROCESSING', label: 'In Production', icon: Package },
  { key: 'SHIPPED',    label: 'Shipped',       icon: Truck },
  { key: 'DELIVERED',  label: 'Delivered',      icon: CheckCircle2 },
];

const TERMINAL_STATUS: Record<string, { label: string; icon: typeof XCircle; color: string }> = {
  CANCELLED: { label: 'Cancelled', icon: XCircle, color: 'text-neutral-400' },
  REFUNDED:  { label: 'Refunded',  icon: RotateCcw, color: 'text-red-400' },
};

function getStepIndex(status: string): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : -1;
}

// ============================================================
// Component
// ============================================================

export default function OrderDetailClient({ order }: { order: SerializedOrder }) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const router = useRouter();

  const isTerminal = currentStatus in TERMINAL_STATUS;
  const currentStepIdx = getStepIndex(currentStatus);

  // 取消 PENDING 订单
  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/cancel`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCurrentStatus('CANCELLED');
        router.refresh();
      } else {
        alert(data.error || 'Failed to cancel order');
      }
    } catch {
      alert('Network error, please try again');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const getTimeForStep = (stepKey: string): string | null => {
    switch (stepKey) {
      case 'PENDING': return formatDate(order.createdAt);
      case 'PROCESSING': return formatDate(order.paidAt);
      case 'SHIPPED': return formatDate(order.shippedAt);
      case 'DELIVERED': return formatDate(order.deliveredAt);
      default: return null;
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[var(--background)] pt-20 pb-8 px-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Back Nav */}
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] font-mono">
              {order.orderNumber}
            </h1>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>

          {/* ============================================ */}
          {/* Action Buttons — 根据状态显示不同操作 */}
          {/* ============================================ */}
          <div className="flex gap-3 flex-wrap">
            {/* PENDING: 前往支付 + 取消订单 */}
            {currentStatus === 'PENDING' && (
              <>
                {order.invoiceUrl ? (
                  <a
                    href={order.invoiceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2 rounded-full bg-[var(--brand-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                  >
                    Pay Now <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  // 开发环境没有 invoiceUrl 时，引导去模拟支付
                  <Link
                    href={`/dev/simulate-payment?orderId=${order.id}`}
                    className="px-5 py-2 rounded-full bg-[var(--brand-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                  >
                    Pay Now <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
                <button
                  onClick={handleCancel}
                  disabled={isCancelling}
                  className="px-5 py-2 rounded-full border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </>
            )}

            {/* PROCESSING: 联系客服取消 */}
            {currentStatus === 'PROCESSING' && (
              <button
                onClick={() => setShowContactModal(true)}
                className="px-5 py-2 rounded-full border border-neutral-500/30 text-[var(--text-secondary)] text-sm font-medium hover:bg-neutral-500/10 transition-colors inline-flex items-center gap-2"
              >
                <Headphones className="w-3.5 h-3.5" />
                Request Cancellation
              </button>
            )}

            {/* SHIPPED / DELIVERED — 无取消按钮 */}
          </div>
        </div>

        {/* ============================================ */}
        {/* Contact Customer Service Modal */}
        {/* ============================================ */}
        {showContactModal && (
          <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-3">
            <div className="flex items-center gap-3">
              <Headphones className="w-5 h-5 text-amber-400" />
              <h3 className="font-semibold text-[var(--text-primary)]">Request Cancellation</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Your order is already in production. To cancel, please contact our customer service team:
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:support@customfigurine.com"
                className="px-4 py-2 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] hover:border-[var(--brand-primary)]/30 transition-colors inline-flex items-center gap-2"
              >
                📧 support@customfigurine.com
              </a>
              <button
                onClick={() => setShowContactModal(false)}
                className="px-4 py-2 rounded-lg text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Status Timeline */}
        <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)]">
          {isTerminal ? (
            // Terminal state display
            <div className="flex items-center gap-3">
              {(() => {
                const termConfig = TERMINAL_STATUS[currentStatus];
                const TermIcon = termConfig.icon;
                return (
                  <>
                    <TermIcon className={`w-6 h-6 ${termConfig.color}`} />
                    <span className={`text-lg font-semibold ${termConfig.color}`}>
                      {termConfig.label}
                    </span>
                    <span className="text-sm text-[var(--text-tertiary)]">
                      {currentStatus === 'CANCELLED' && order.cancelledAt && `on ${formatDate(order.cancelledAt)}`}
                    </span>
                  </>
                );
              })()}
            </div>
          ) : (
            // Progress timeline
            <div className="flex items-center justify-between">
              {STATUS_STEPS.map((step, idx) => {
                const StepIcon = step.icon;
                const isCompleted = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const timeStr = getTimeForStep(step.key);

                return (
                  <div key={step.key} className="flex flex-col items-center flex-1 relative">
                    {/* Connector line */}
                    {idx > 0 && (
                      <div
                        className={`absolute top-5 -left-1/2 w-full h-0.5 ${
                          idx <= currentStepIdx ? 'bg-[var(--brand-primary)]' : 'bg-[var(--border-subtle)]'
                        }`}
                        style={{ zIndex: 0 }}
                      />
                    )}
                    {/* Icon circle */}
                    <div
                      className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isCompleted
                          ? 'bg-[var(--brand-primary)] text-white'
                          : 'bg-[var(--surface-sunken)] text-[var(--text-tertiary)]'
                      } ${isCurrent ? 'ring-4 ring-[var(--brand-primary)]/20' : ''}`}
                    >
                      <StepIcon className="w-4 h-4" />
                    </div>
                    {/* Label */}
                    <span className={`mt-2 text-xs font-medium ${
                      isCompleted ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
                    }`}>
                      {step.label}
                    </span>
                    {/* Time */}
                    {timeStr && isCompleted && (
                      <span className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                        {timeStr}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tracking Info */}
        {(currentStatus === 'SHIPPED' || currentStatus === 'DELIVERED') && order.trackingUrl && (
          <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Tracking: {order.trackingNumber || 'Available'}
                </p>
              </div>
            </div>
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              Track Package <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Order Items + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Order Items</h3>
            {order.items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] flex gap-4"
              >
                {/* Item Image */}
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-[var(--surface-sunken)] flex-shrink-0">
                  {item.generatedImageUrl ? (
                    <img
                      src={item.generatedImageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setLightboxImage(item.generatedImageUrl)}
                    />
                  ) : item.originalImageUrl ? (
                    <img
                      src={item.originalImageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setLightboxImage(item.originalImageUrl)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-[var(--text-tertiary)] opacity-40" />
                    </div>
                  )}
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {item.size && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-sunken)] text-[var(--text-secondary)]">
                            {item.size}
                          </span>
                        )}
                        <span className="text-xs text-[var(--text-tertiary)]">
                          Qty: {item.quantity}
                        </span>
                      </div>
                    </div>
                    <span className="font-semibold text-[var(--text-primary)] whitespace-nowrap">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Image links */}
                  <div className="flex items-center gap-3 mt-2">
                    {item.originalImageUrl && (
                      <button
                        onClick={() => setLightboxImage(item.originalImageUrl)}
                        className="text-xs text-[var(--brand-primary)] hover:underline flex items-center gap-1"
                      >
                        <ImageIcon className="w-3 h-3" /> Original
                      </button>
                    )}
                    {item.generatedImageUrl && (
                      <button
                        onClick={() => setLightboxImage(item.generatedImageUrl)}
                        className="text-xs text-[var(--brand-primary)] hover:underline flex items-center gap-1"
                      >
                        <ImageIcon className="w-3 h-3" /> AI Generated
                      </button>
                    )}
                  </div>

                  {/* Custom instructions */}
                  {item.customInstructions && (
                    <div className="mt-2 p-2 rounded-lg bg-[var(--surface-sunken)] text-xs text-[var(--text-secondary)] flex items-start gap-2">
                      <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-[var(--text-tertiary)]" />
                      <span>{item.customInstructions}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Summary</h3>
            <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Subtotal</span>
                <span className="text-[var(--text-primary)]">${order.subtotalAmount.toFixed(2)}</span>
              </div>
              {order.discountCode && order.discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400 flex items-center gap-1">
                    Discount
                    <span className="text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {order.discountCode}
                    </span>
                  </span>
                  <span className="text-emerald-400">-${order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-[var(--border-subtle)] pt-3 flex justify-between">
                <span className="font-medium text-[var(--text-primary)]">Total</span>
                <span className="text-xl font-bold text-[var(--brand-primary)]">
                  ${order.totalAmount.toFixed(2)}
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-tertiary)] text-right">
                {order.currency}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Preview"
            className="max-w-full max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
