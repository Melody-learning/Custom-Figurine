import { create } from 'zustand';
import { persist, StateStorage, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { CartItem, ImageGenerationStatus, GenerationResult } from '@/types';

// Custom IDB storage handler for Zustand
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

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
  generatedViews: { primary: string, back: string, side: string } | null;
  setGeneratedViews: (views: { primary: string, back: string, side: string } | null) => void;
  generationStatus: ImageGenerationStatus;
  setGenerationStatus: (status: ImageGenerationStatus) => void;

  // 购物车侧边栏
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;

  // 全局登录弹窗
  isLoginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;

  // Vault Re-engagement Context Lock
  editingVaultAssetId: string | null;
  setEditingVaultAssetId: (id: string | null) => void;

  // 全量清空生成态 (State Machine Reboot)
  resetGenerationFlow: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (setGlobalState) => ({
      // 购物车
      cart: [],
      addToCart: (item) =>
        setGlobalState((state) => ({
          cart: [
            ...state.cart,
            {
              ...item,
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            },
          ],
        })),
      removeFromCart: (id) =>
        setGlobalState((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        setGlobalState((state) => ({
          cart: state.cart.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        })),
      clearCart: () => setGlobalState({ cart: [] }),

      // AI 生图
      uploadedImage: null,
      setUploadedImage: (image) => setGlobalState({ uploadedImage: image }),
      generatedImage: null,
      setGeneratedImage: (image) => setGlobalState({ generatedImage: image }),
      generatedViews: null,
      setGeneratedViews: (views) => setGlobalState({ generatedViews: views }),
      generationStatus: 'idle',
      setGenerationStatus: (status) => setGlobalState({ generationStatus: status }),

      // 购物车侧边栏
      isCartOpen: false,
      setCartOpen: (open) => setGlobalState({ isCartOpen: open }),

      // 全局登录弹窗
      isLoginModalOpen: false,
      setLoginModalOpen: (open) => setGlobalState({ isLoginModalOpen: open }),

      // Vault Re-engagement
      editingVaultAssetId: null,
      setEditingVaultAssetId: (id) => setGlobalState({ editingVaultAssetId: id }),

      // 物理清扫所有生成态数据
      resetGenerationFlow: () => setGlobalState({ 
         uploadedImage: null, 
         generatedImage: null, 
         generatedViews: null,
         generationStatus: 'idle',
         editingVaultAssetId: null
      }),
    }),
    {
      name: 'figurine-storage',
      storage: createJSONStorage(() => idbStorage),
      // We ONLY want to persist cart items. Draft images are ephemeral (RAM only).
      partialize: (state) => ({
        cart: state.cart,
      }),
    }
  )
);
