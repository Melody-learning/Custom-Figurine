import { create } from 'zustand';
import { CartItem, ImageGenerationStatus, GenerationResult } from '@/types';

interface AppState {
  // 购物车
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;

  // AI 生图
  uploadedImage: string | null;
  setUploadedImage: (image: string | null) => void;
  generatedImage: string | null;
  setGeneratedImage: (image: string | null) => void;
  generationStatus: ImageGenerationStatus;
  setGenerationStatus: (status: ImageGenerationStatus) => void;

  // 购物车侧边栏
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  // 购物车
  cart: [],
  addToCart: (item) =>
    set((state) => ({
      cart: [
        ...state.cart,
        {
          ...item,
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      ],
    })),
  removeFromCart: (id) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== id),
    })),
  updateQuantity: (id, quantity) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === id ? { ...item, quantity } : item
      ),
    })),
  clearCart: () => set({ cart: [] }),

  // AI 生图
  uploadedImage: null,
  setUploadedImage: (image) => set({ uploadedImage: image }),
  generatedImage: null,
  setGeneratedImage: (image) => set({ generatedImage: image }),
  generationStatus: 'idle',
  setGenerationStatus: (status) => set({ generationStatus: status }),

  // 购物车侧边栏
  isCartOpen: false,
  setCartOpen: (open) => set({ isCartOpen: open }),
}));
