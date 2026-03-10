'use client';

import { X, Minus, Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { useThemeConfig } from '@/lib/useTheme';

export function CartSidebar() {
  const { cart, isCartOpen, setCartOpen, removeFromCart, updateQuantity } = useStore();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { t: translate } = useTranslation();
  const { config, theme } = useThemeConfig();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (key: any): string => {
    return translate(key) as string;
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsCheckingOut(true);
    try {
      const uploadImage = async (imageSrc: string) => {
        if (!imageSrc.startsWith('data:')) return imageSrc;
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: imageSrc })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Image upload failed');
        return data.url;
      };

      const checkoutItems = await Promise.all(cart.map(async (item) => {
        let aiImageUrl = item.generatedImage;
        let originalImageUrl = item.customImage;

        if (aiImageUrl?.startsWith('data:')) aiImageUrl = await uploadImage(aiImageUrl);
        if (originalImageUrl?.startsWith('data:')) originalImageUrl = await uploadImage(originalImageUrl);

        return {
          variantId: item.variantId,
          quantity: item.quantity,
          customAttributes: [
            ...(aiImageUrl ? [{ key: 'AI Generated Image', value: aiImageUrl }] : []),
            ...(originalImageUrl ? [{ key: 'Uploaded Image', value: originalImageUrl }] : [])
          ]
        };
      }));

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: checkoutItems })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Checkout API failed');
      }
      
      window.location.href = data.url;
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(`${t('checkoutError')}: ${error.message || ''}`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  // 主题样式
  const buttonStyle = theme === 'neo-brutalist'
    ? 'border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
    : theme === 'elegant'
    ? 'rounded-full bg-amber-900 hover:bg-amber-800'
    : theme === 'editorial'
    ? 'rounded-none bg-black hover:bg-gray-800 border-2 border-black'
    : theme === 'watercolor'
    ? 'rounded-2xl bg-rose-300 hover:bg-rose-400 shadow-md'
    : 'rounded-full bg-black hover:bg-gray-800';

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
              <div className="mb-4 flex items-center justify-between">
                <span className="font-medium" style={{ color: config.colors.text }}>Total</span>
                <span className="text-lg font-semibold" style={{ color: config.colors.primary }}>${total.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className={`w-full py-3 font-medium text-white disabled:opacity-50 ${buttonStyle}`}
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
