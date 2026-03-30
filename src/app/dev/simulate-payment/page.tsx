'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Beaker, CheckCircle2, XCircle, RotateCcw, Truck, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

function SimulatePaymentContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        setOrder(data.order);
        setLoading(false);
      })
      .catch(() => {
        setMessage({ type: 'error', text: 'Failed to load order' });
        setLoading(false);
      });
  }, [orderId]);

  const handleSimulate = async (event: string) => {
    if (!orderId) return;
    setActionLoading(event);
    setMessage(null);
    try {
      const res = await fetch('/api/dev/simulate-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          event,
          trackingNumber: event === 'fulfilled' ? 'SIM-TRK-123456' : undefined,
          trackingUrl: event === 'fulfilled' ? 'https://track.example.com/SIM-TRK-123456' : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: `✓ ${event} simulated successfully` });
        setOrder(data.order);
      } else {
        setMessage({ type: 'error', text: data.error || 'Simulation failed' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setActionLoading(null);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
        <p>This page is only available in development mode.</p>
      </div>
    );
  }

  if (!orderId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
        <p>Missing orderId parameter.</p>
      </div>
    );
  }

  const status = (order as Record<string, unknown>)?.status as string || 'LOADING';

  const actions = [
    {
      event: 'payment_success',
      label: 'Simulate Payment Success',
      description: 'PENDING → PROCESSING',
      icon: CheckCircle2,
      color: 'bg-emerald-600 hover:bg-emerald-700',
      enabled: status === 'PENDING',
    },
    {
      event: 'fulfilled',
      label: 'Simulate Fulfillment',
      description: 'PROCESSING → SHIPPED',
      icon: Truck,
      color: 'bg-purple-600 hover:bg-purple-700',
      enabled: status === 'PROCESSING',
    },
    {
      event: 'refunded',
      label: 'Simulate Refund',
      description: 'PROCESSING → REFUNDED',
      icon: RotateCcw,
      color: 'bg-red-600 hover:bg-red-700',
      enabled: status === 'PROCESSING',
    },
    {
      event: 'payment_failure',
      label: 'Simulate Payment Failure',
      description: 'Keep as PENDING',
      icon: XCircle,
      color: 'bg-neutral-600 hover:bg-neutral-700',
      enabled: status === 'PENDING',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8">
      <div className="max-w-xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10">
            <Beaker className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Dev Payment Simulator</h1>
            <p className="text-sm text-neutral-400">Simulate Shopify payment events locally</p>
          </div>
        </div>

        {/* Order Info */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
          </div>
        ) : order ? (
          <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm">{(order as Record<string, unknown>).orderNumber as string}</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400">
                {status}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-neutral-400">
              <span>Total</span>
              <span className="text-white font-semibold">
                ${((order as Record<string, unknown>).totalAmount as number)?.toFixed(2)}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-red-400 text-sm">Order not found</p>
        )}

        {/* Message */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message.text}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {actions.map((action) => {
            const ActionIcon = action.icon;
            return (
              <button
                key={action.event}
                onClick={() => handleSimulate(action.event)}
                disabled={!action.enabled || actionLoading !== null}
                className={`w-full flex items-center justify-between p-4 rounded-xl text-white text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${action.color}`}
              >
                <div className="flex items-center gap-3">
                  {actionLoading === action.event ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ActionIcon className="w-5 h-5" />
                  )}
                  <div className="text-left">
                    <p>{action.label}</p>
                    <p className="text-xs opacity-70">{action.description}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 opacity-50" />
              </button>
            );
          })}
        </div>

        {/* Link to order detail */}
        {order && (
          <Link
            href={`/profile/orders/${orderId}`}
            className="block text-center text-sm text-[var(--brand-primary)] hover:underline"
          >
            View Order Detail →
          </Link>
        )}
      </div>
    </div>
  );
}

export default function SimulatePaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
      </div>
    }>
      <SimulatePaymentContent />
    </Suspense>
  );
}
