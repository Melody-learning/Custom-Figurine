'use client';

import { X, Minus, Plus, Trash2, Tag } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { useThemeConfig } from '@/lib/useTheme';
import { upload } from '@vercel/blob/client';
import { useSession } from 'next-auth/react';

interface ActiveCoupon {
  id: string;
  code: string;
  title: string;
  discountType: string;
  discountValue: number;
  source: 'WELCOME' | 'KOL';
}

export function CartSidebar() {
  const { cart, isCartOpen, setCartOpen, removeFromCart, updateQuantity, clearCart } = useStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [activeCoupons, setActiveCoupons] = useState<ActiveCoupon[]>([]);
  const [selectedCouponCode, setSelectedCouponCode] = useState<string | null>(null);
  const [couponsFetched, setCouponsFetched] = useState(false);
  const { t: translate } = useTranslation();
  const { config } = useThemeConfig();
  const { data: session } = useSession();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (key: any): string => {
    return translate(key) as string;
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Helper: calculate actual discount amount for a coupon
  const calcDiscount = (c: ActiveCoupon) =>
    c.discountType === 'PERCENTAGE'
      ? Math.round(subtotal * (c.discountValue / 100) * 100) / 100
      : Math.min(c.discountValue, subtotal);

  // Fetch active coupons when cart opens
  useEffect(() => {
    if (isCartOpen && session?.user?.id) {
      fetch('/api/coupon/active')
        .then(res => res.json())
        .then(data => {
          if (data.coupons) {
            setActiveCoupons(data.coupons);
            setCouponsFetched(true);
          }
        })
        .catch(err => console.error('Failed to fetch coupons:', err));
    }
  }, [isCartOpen, session?.user?.id]);

  // Auto-select the best coupon when coupons are first fetched
  useEffect(() => {
    if (couponsFetched && activeCoupons.length > 0 && selectedCouponCode === null) {
      const best = activeCoupons.reduce((prev, curr) =>
        calcDiscount(curr) > calcDiscount(prev) ? curr : prev
      );
      setSelectedCouponCode(best.code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponsFetched, activeCoupons]);

  // Currently selected coupon
  const selectedCoupon = activeCoupons.find(c => c.code === selectedCouponCode) || null;
  const discountPreview = selectedCoupon ? calcDiscount(selectedCoupon) : 0;
  const estimatedTotal = Math.round((subtotal - discountPreview) * 100) / 100;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsCheckingOut(true);
    try {
      const uploadImage = async (imageSrc: string) => {
        if (!imageSrc.startsWith('data:')) return imageSrc;
        
        const res = await fetch(imageSrc);
        const blob = await res.blob();
        const file = new File([blob], `checkout-img-${Date.now()}.png`, { type: blob.type });

        const newBlob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload-token',
        });

        return newBlob.url;
      };

      const checkoutItems = await Promise.all(cart.map(async (item) => {
        let aiImageUrl = item.generatedImage;
        let originalImageUrl = item.customImage;

        if (aiImageUrl?.startsWith('data:')) aiImageUrl = await uploadImage(aiImageUrl);
        if (originalImageUrl?.startsWith('data:')) originalImageUrl = await uploadImage(originalImageUrl);

        return {
          variantId: item.variantId,
          quantity: item.quantity,
          title: item.title,
          price: item.price,
          originalImageUrl: originalImageUrl || undefined,
          generatedImageUrl: aiImageUrl || undefined,
          customAttributes: [
            ...(aiImageUrl ? [{ key: '_AI Generated Image', value: aiImageUrl }] : []),
            ...(originalImageUrl ? [{ key: '_Uploaded Image', value: originalImageUrl }] : [])
          ]
        };
      }));

      // Pass user's selected coupon code to server (including __NONE__ for no coupon)
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: checkoutItems,
          selectedCouponCode: selectedCouponCode || undefined,
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Checkout API failed');
      }
      
      clearCart();
      window.location.href = data.url;
    } catch (error: unknown) {
      console.error('Checkout error:', error);
      const message = error instanceof Error ? error.message : '';
      alert(`${t('checkoutError')}: ${message}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const buttonStyle = 'rounded-full bg-black hover:bg-gray-800';

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setCartOpen(false)}
      />

      {/* 侧边栏 */}
      <div className="relative h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between border-b p-4" style={{ borderColor: config.colors.border }}>
            <h2 className="text-lg font-semibold" style={{ color: config.colors.text }}>{t('shoppingCart')}</h2>
            <button
              onClick={() => setCartOpen(false)}
              className="rounded-full p-2 hover:bg-gray-100"
            >
              <X className="h-5 w-5" style={{ color: config.colors.text }} />
            </button>
          </div>

          {/* 商品列表 */}
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <p className="text-center" style={{ color: config.colors.textMuted }}>{t('emptyCart')}</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-lg border p-3"
                    style={{ borderColor: config.colors.border }}
                  >
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded bg-gray-100">
                      {item.generatedImage ? (
                        <img src={item.generatedImage} alt={item.title} className="h-full w-full object-cover" />
                      ) : item.image ? (
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center" style={{ color: config.colors.textMuted }}>
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="font-medium" style={{ color: config.colors.text }}>{item.title}</h3>
                        <p className="text-sm" style={{ color: config.colors.textMuted }}>
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="rounded border p-1 hover:bg-gray-100"
                            style={{ borderColor: config.colors.border }}
                          >
                            <Minus className="h-3 w-3" style={{ color: config.colors.text }} />
                          </button>
                          <span className="w-8 text-center" style={{ color: config.colors.text }}>{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="rounded border p-1 hover:bg-gray-100"
                            style={{ borderColor: config.colors.border }}
                          >
                            <Plus className="h-3 w-3" style={{ color: config.colors.text }} />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部 */}
          {cart.length > 0 && (
            <div className="border-t p-4" style={{ borderColor: config.colors.border }}>
              {/* 券选择器 */}
              {activeCoupons.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium mb-1.5 flex items-center gap-1" style={{ color: config.colors.textMuted }}>
                    <Tag className="h-3 w-3" /> Apply Coupon
                  </p>
                  <div className="space-y-1.5 max-h-28 overflow-y-auto">
                    {activeCoupons.map((c) => {
                      const amt = calcDiscount(c);
                      const isSelected = selectedCouponCode === c.code;
                      return (
                        <label
                          key={c.code}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all ${
                            isSelected
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="coupon"
                              checked={isSelected}
                              onChange={() => setSelectedCouponCode(c.code)}
                              className="accent-green-600"
                            />
                            <span className={isSelected ? 'text-green-700 font-medium' : 'text-gray-700'}>
                              {c.title}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              isSelected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `$${c.discountValue}`}
                            </span>
                          </div>
                          <span className={`text-xs font-medium ${isSelected ? 'text-green-600' : 'text-gray-400'}`}>
                            -${amt.toFixed(2)}
                          </span>
                        </label>
                      );
                    })}
                    {/* No coupon option */}
                    <label
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all ${
                        selectedCouponCode === '__NONE__'
                          ? 'border-gray-400 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="coupon"
                        checked={selectedCouponCode === '__NONE__'}
                        onChange={() => setSelectedCouponCode('__NONE__')}
                        className="accent-gray-500"
                      />
                      <span className="text-gray-500">No coupon</span>
                    </label>
                  </div>
                </div>
              )}

              {/* 价格 */}
              <div className="mb-4 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-sm" style={{ color: config.colors.textMuted }}>
                  <span>{t('Subtotal') || 'Subtotal'}</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {selectedCoupon && (
                  <div className="flex items-center justify-between text-sm text-green-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 flex-shrink-0" />
                      {selectedCoupon.title}
                    </span>
                    <span>-${discountPreview.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between font-medium pt-2 border-t" style={{ borderColor: config.colors.border, color: config.colors.text }}>
                  <span>{t('Total') || 'Total'}</span>
                  <div className="text-right">
                    {selectedCoupon ? (
                      <>
                        <span className="text-sm line-through mr-2" style={{ color: config.colors.textMuted }}>${subtotal.toFixed(2)}</span>
                        <span className="text-xl font-bold" style={{ color: config.colors.primary }}>${estimatedTotal.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="text-xl font-bold" style={{ color: config.colors.primary }}>${subtotal.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className={`w-full py-3.5 font-bold text-white shadow-lg transition-all disabled:opacity-50 ${buttonStyle}`}
              >
                {isCheckingOut ? t('processing') : t('checkout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
