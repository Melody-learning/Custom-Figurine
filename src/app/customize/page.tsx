'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Sparkles, Loader2, ArrowRight, Check, Image as ImageIcon, Smile, Triangle, Box, Aperture } from 'lucide-react';
import { useStore } from '@/lib/store';
import { getProducts, Product, ProductVariant } from '@/lib/shopify';
import { saveGeneratedAsset } from '@/app/actions/save-asset';
import { useTranslation } from '@/lib/useTranslation';
import { useThemeConfig } from '@/lib/useTheme';
import FigurineGenerationGallery from '@/components/ai/FigurineGenerationGallery';
import { ClickableImage } from '@/components/ImageLightbox';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { removeImageBackground, isBgRemovalEnabled, type BgRemovalProgress } from '@/lib/remove-background';
import { STYLE_CATEGORIES, StylePreset, StyleCategory, getDefaultPreset } from '@/lib/constants/style-presets';

type Step = 'upload' | 'style' | 'generate' | 'confirm';

export default function CustomizePage() {
  const [step, setStep] = useState<Step>('upload');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);
  const { t: translate } = useTranslation();
  const { config } = useThemeConfig();
  const { data: session } = useSession();
  const router = useRouter();

  // 风格数据（从 API 加载，fallback 到静态常量）
  const [styleCategories, setStyleCategories] = useState<StyleCategory[]>(STYLE_CATEGORIES);
  const [isLoadingStyles, setIsLoadingStyles] = useState(true);

  useEffect(() => {
    fetch('/api/style-presets')
      .then((r) => r.json())
      .then((data: StyleCategory[]) => {
        if (Array.isArray(data) && data.length > 0) setStyleCategories(data);
      })
      .catch(() => { /* 静默降级，保持 STYLE_CATEGORIES 静态常量 */ })
      .finally(() => setIsLoadingStyles(false));
  }, []);

  // 辅助函数（从动态数组派生，替代静态辅助函数）
  const findPresetById = (id: string): StylePreset | undefined => {
    for (const cat of styleCategories) {
      const found = cat.presets.find((p) => p.id === id);
      if (found) return found;
    }
    return undefined;
  };
  const findCategoryByPresetId = (id: string): StyleCategory | undefined =>
    styleCategories.find((cat) => cat.presets.some((p) => p.id === id));

  // 风格选取状态
  const defaultPreset = getDefaultPreset();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(defaultPreset.categoryId);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(defaultPreset.id);

  // 辅助计算值
  const selectedPreset: StylePreset | undefined = findPresetById(selectedPresetId);
  const selectedCategory = findCategoryByPresetId(selectedPresetId);
  const selectedCategoryIsOrderable = selectedCategory?.isOrderable ?? true;

  // 简化的翻译函数，返回字符串
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (key: any): string => {
    return translate(key) as string;
  };

  // 选项状态
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [galleryStatus, setGalleryStatus] = useState<string>('IDLE');
  const [isAddedToCart, setIsAddedToCart] = useState<boolean>(false);

  /* BG Removal 状态 */
  const [bgOriginal, setBgOriginal] = useState<string | null>(null);     // 原图（抠图前）
  const [bgProcessed, setBgProcessed] = useState<string | null>(null);   // 抠图结果缓存
  const [bgProcessing, setBgProcessing] = useState(false);               // WASM 是否在执行
  const [bgProgress, setBgProgress] = useState<BgRemovalProgress | null>(null); // 抠图实时进度
  const [bgFilterEnabled, setBgFilterEnabled] = useState(false);          // Toggle 开关
  const bgCancelledRef = useRef(false);                                  // 抠图取消标记
  const bgSourceRef = useRef<string | null>(null);                       // PNG 源图（用于重新抠图）


  const {
    uploadedImage,
    setUploadedImage,
    generatedImage,
    setGeneratedImage,
    generatedViews,
    setGeneratedViews,
    setGenerationStatus,
    generationStatus,
    addToCart,
    setCartOpen,
    setLoginModalOpen,
    editingVaultAssetId,
    setEditingVaultAssetId,
    resetGenerationFlow,
  } = useStore();

  // UX 状态机核心：初次挂载与刷新归零 (Blacklist Pattern)
  useEffect(() => {
    // Only run this alignment once on mount, rather than reacting to every state change naturally.
    // This prevents "bounce-back" bugs when navigating away but leaving state dirty.
    const isFromVault = new URLSearchParams(window.location.search).get('source') === 'vault';

    if (isFromVault && editingVaultAssetId) {
       // Safely entering from Vault, jump to gallery
       setStep('generate');
    } else {
       // Entering organically without a vault source. Blanket wipe.
       resetGenerationFlow();
       setStep('upload');
       setIsAddedToCart(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs strictly on mount

  // 回滚防护 (Auto-Recovery): 修复当在 /customize 页面内再次点击顶部 /customize 链接出现的白屏。
  // 因为 zustand state 被清空但不触发挂载重载，我们需要一个小探针把本地路由重置。
  useEffect(() => {
     if (!uploadedImage && !editingVaultAssetId && step !== 'upload' && step !== 'style') {
        setStep('upload');
        setIsAddedToCart(false);
     }
  }, [uploadedImage, editingVaultAssetId, step]);

  // ==========================================
  // 浏览器原生拦截（已废除）: 曾经这里有 beforeunload 和 popstate
  // 根据 Phase 4 (Holistic Navigation & Safe Context)，既然资产一经生成或唤回就一定会在 Vault 存在，
  // 我们不再暴力锁死浏览器的返回和刷新。
  // ==========================================

  // 加载商品列表
  useEffect(() => {
    async function loadProducts() {
      try {
        const prods = await getProducts();
        setProducts(prods);

        // 默认选择第一个变体的选项
        if (prods.length > 0 && prods[0].variants.edges.length > 0) {
          const firstVariant = prods[0].variants.edges[0].node;
          const options: Record<string, string> = {};
          firstVariant.selectedOptions.forEach((opt) => {
            options[opt.name] = opt.value;
          });
          setSelectedOptions(options);
          setSelectedVariant({
            id: firstVariant.id,
            title: firstVariant.title,
            price: parseFloat(firstVariant.price.amount),
            currencyCode: firstVariant.price.currencyCode,
            selectedOptions: firstVariant.selectedOptions,
          });
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    }
    loadProducts();
  }, []);

  // 根据选项找到对应的变体
  useEffect(() => {
    if (products.length === 0) return;

    const product = products[0];
    const variant = product.variants.edges.find(({ node }) => {
      return node.selectedOptions.every(
        (opt) => selectedOptions[opt.name] === opt.value
      );
    });

    if (variant) {
      setSelectedVariant({
        id: variant.node.id,
        title: variant.node.title,
        price: parseFloat(variant.node.price.amount),
        currencyCode: variant.node.price.currencyCode,
        selectedOptions: variant.node.selectedOptions,
      });
    }
  }, [selectedOptions, products]);

  // 判断某个选项值在当前其他选项下是否有对应的有效 variant
  const isOptionValueAvailable = (optionName: string, value: string): boolean => {
    if (!product) return false;
    return product.variants.edges.some(({ node }) =>
      node.selectedOptions.every((opt) => {
        if (opt.name === optionName) return opt.value === value;
        // 其他维度必须匹配当前选中值（未选中则不约束）
        return !selectedOptions[opt.name] || selectedOptions[opt.name] === opt.value;
      })
    );
  };

  // 处理选项变更（含自动纠正无效组合）
  const handleOptionChange = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };

    // 检查新组合是否对应一个真实 variant
    const hasMatch = product?.variants.edges.some(({ node }) =>
      node.selectedOptions.every((opt) => newOptions[opt.name] === opt.value)
    );

    if (!hasMatch && product) {
      // 当前组合无效 → 找第一个包含用户所选值的有效 variant，自动纠正其他维度
      const firstValid = product.variants.edges.find(({ node }) =>
        node.selectedOptions.some((opt) => opt.name === optionName && opt.value === value)
      );
      if (firstValid) {
        const corrected: Record<string, string> = {};
        firstValid.node.selectedOptions.forEach((opt) => {
          corrected[opt.name] = opt.value;
        });
        setSelectedOptions(corrected);
        return;
      }
    }

    setSelectedOptions(newOptions);
  };

  // 压缩图片到指定尺寸，支持 JPEG/PNG 双模式输出
  // JPEG 模式：填白底 + 0.8 质量（最小体积，用于最终存储）
  // PNG 模式：保留原始透明通道（用于抠图输入，避免白底污染）
  const compressImage = (file: File, maxWidth: number, outputFormat: 'jpeg' | 'png' = 'jpeg'): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions with a STRICT 1024 bounding box (1K Normalization)
          if (Math.max(width, height) > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            if (outputFormat === 'jpeg') {
              // JPEG 模式：填白底防止透明区域变黑
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
            }
            // PNG 模式：不填充背景，保留原始透明通道
            ctx.drawImage(img, 0, 0, width, height);
          }
          
          if (outputFormat === 'png') {
            resolve(canvas.toDataURL('image/png'));
          } else {
            // JPEG 80% 质量，大幅减小 base64 体积 (Fix QuotaExceededError)
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          }
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 检测 Canvas 中的图片是否已有透明背景（边缘像素采样）
  // 扫描四边各一行/列，统计 alpha < 250 的像素占比，超过 5% 判定为透明
  const hasTransparentBackground = (dataUrl: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(false); return; }
        
        ctx.drawImage(img, 0, 0);
        
        const w = img.width;
        const h = img.height;
        let transparentPixels = 0;
        let totalSampled = 0;

        // 采样四条边
        const samplePixel = (x: number, y: number) => {
          const pixel = ctx.getImageData(x, y, 1, 1).data;
          totalSampled++;
          if (pixel[3] < 250) transparentPixels++;
        };

        // 为性能考虑，每条边最多采样 100 个像素点
        const stepX = Math.max(1, Math.floor(w / 100));
        const stepY = Math.max(1, Math.floor(h / 100));

        for (let x = 0; x < w; x += stepX) {
          samplePixel(x, 0);           // 顶边
          samplePixel(x, h - 1);       // 底边
        }
        for (let y = 0; y < h; y += stepY) {
          samplePixel(0, y);           // 左边
          samplePixel(w - 1, y);       // 右边
        }

        const ratio = totalSampled > 0 ? transparentPixels / totalSampled : 0;
        console.log(`[TransparencyDetect] ${transparentPixels}/${totalSampled} edge pixels transparent (${(ratio * 100).toFixed(1)}%)`);
        resolve(ratio > 0.05); // 超过 5% 判定为已有透明背景
      };
      img.onerror = () => resolve(false);
      img.src = dataUrl;
    });
  };

  // 将透明 PNG data URL 降级为 JPEG（填白底），用于最终存入 state 以节省 localStorage
  const downgradeToJpeg = (pngDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('No canvas context')); return; }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, img.width, img.height);
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = pngDataUrl;
    });
  };

  // 核心文件处理逻辑（click-upload 和 drag-drop 共享）
  const processUploadedFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;

    try {
      const bgEnabled = isBgRemovalEnabled() && bgFilterEnabled;

      if (bgEnabled) {
        // === 抠图模式：用 PNG 压缩保留透明通道，给抠图更干净的输入 ===
        const pngBase64 = await compressImage(file, 1024, 'png');
        bgSourceRef.current = pngBase64; // 保存 PNG 源图供 toggle 重新抠图用
        
        // 立即显示预览（PNG 中间态）
        const jpegPreview = await downgradeToJpeg(pngBase64);
        setUploadedImage(jpegPreview);
        setBgOriginal(jpegPreview);
        setBgProcessed(null); // 清除旧缓存

        // 检测是否已有透明背景，有则跳过抠图
        const alreadyTransparent = await hasTransparentBackground(pngBase64);
        if (alreadyTransparent) {
          console.log('[Upload] Image already has transparent background, skipping BG removal.');
          const jpegResult = await downgradeToJpeg(pngBase64);
          setUploadedImage(jpegResult);
          setBgOriginal(null);
          return;
        }

        // 执行抠图（setTimeout 让 React 先渲染 loading 态）
        bgCancelledRef.current = false;
        setBgProcessing(true);
        setBgProgress(null);
        setTimeout(() => {
          removeImageBackground(pngBase64, (p) => setBgProgress(p)).then(async (result) => {
            setBgProcessing(false);
            setBgProgress(null);
            if (bgCancelledRef.current) {
              console.log('[BgRemoval] Cancelled by user. Ignoring result.');
              return;
            }
            if (result.wasProcessed) {
              console.log('[BgRemoval] Done. Caching processed image.');
              const jpegResult = await downgradeToJpeg(result.processedImageUrl);
              setBgProcessed(jpegResult);       // 缓存抠图结果
              setUploadedImage(jpegResult);      // 展示抠图版
            } else {
              setBgOriginal(null);
            }
          });
        }, 50); // 50ms 足够让 React 完成一次渲染周期
      } else {
        // === 非抠图模式：JPEG 直出 ===
        const compressedBase64 = await compressImage(file, 1024, 'jpeg');
        setUploadedImage(compressedBase64);
        // 也压缩一份 PNG 备用（后续 toggle ON 时需要）
        const pngForLater = await compressImage(file, 1024, 'png');
        bgSourceRef.current = pngForLater;
        // 设置新原图引用 + 清理旧抠图缓存
        setBgOriginal(compressedBase64);
        setBgProcessed(null);
        setBgProcessing(false);
      }
    } catch (error) {
      console.error("Failed to process image:", error);
      setBgProcessing(false);
      alert(t('uploadError') || 'Failed to process image');
    }
  };

  // 处理文件上传（click 模式）
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(file);
  };

  // Drag-and-drop 事件处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        processUploadedFile(file);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleGenerate = async (overrideImageTarget?: string) => {
    if (!session) {
      if (uploadedImage) {
        sessionStorage.setItem('pendingCustomFigurineImage', uploadedImage);
      }
      toast(t('loginRequired') as string);
      setLoginModalOpen(true);
      return;
    }

    // Instead of faking a network call here, we just transition UI state
    // and let the FigurineGenerationGallery handle the actual Generation pipeline
    setStep('generate');
  };

  // Restore pending image after login
  useEffect(() => {
    const pendingImage = sessionStorage.getItem('pendingCustomFigurineImage');
    if (pendingImage && session) {
      setUploadedImage(pendingImage);
      sessionStorage.removeItem('pendingCustomFigurineImage');
      // Already handled by global SessionToastProvider
    }
  }, [session, setUploadedImage]);

  // 加入购物车并发动终极状态清空
  const handleAddToCart = () => {
    if (!selectedVariant) return;

    addToCart({
      variantId: selectedVariant.id,
      title: `Custom Figurine - ${selectedVariant.title}`,
      price: selectedVariant.price,
      quantity: 1,
      image: uploadedImage || undefined,
      customImage: uploadedImage || undefined,
      generatedImage: generatedImage || undefined,
    });

    setCartOpen(true);
    setIsAddedToCart(true);
  };

  const product = products[0];
  const stepsList = t('steps');

  const styles = {
    button: 'rounded-full bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300',
    card: 'rounded-2xl border shadow-lg bg-white/80 backdrop-blur-md animate-slide-up-fade',
    stepActive: 'bg-black text-white shadow-md ring-4 ring-gray-100',
    stepCompleted: 'bg-green-500 text-white shadow-md',
    stepInactive: 'bg-gray-100 text-gray-400',
  };

  return (
    <main className={`min-h-screen relative overflow-hidden transition-all duration-700 ${step === 'generate' && galleryStatus === 'COMPLETE' ? 'py-4 sm:py-6' : 'py-12'}`} style={{ backgroundColor: config.colors.backgroundAlt }}>
      {/* Animated Background Gradients */}
      <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
      <div className="absolute top-20 -left-20 w-96 h-96 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-gradient-to-l from-yellow-200/30 to-rose-200/30 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className={`w-full mx-auto px-4 sm:px-6 xl:px-8 relative z-10 transition-all duration-700 ${step === 'generate' && galleryStatus === 'COMPLETE' ? 'max-w-[1600px]' : 'max-w-4xl'}`}>
        
        {/* Professional Header Row with Steps & Security Badge */}
        {step !== 'upload' && (
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6 transition-all duration-500">
           {/* Left: Dynamic Step Title & Vault Status */}
           <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                 <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight transition-all" style={{ color: config.colors.text }}>
                     {step === 'style' && 'Choose Your Style'}
                     {step === 'generate' && 'Crafting Your Figurine'}
                     {step === 'confirm' && 'Review & Order'}
                 </h1>
                 
                 {/* Security Badge inline with title */}
                 {step === 'generate' && (galleryStatus === 'GENERATING_PRIMARY' || galleryStatus === 'GENERATING_SECONDARY') && !editingVaultAssetId && (
                     <div className="animate-in fade-in slide-in-from-left-2 zoom-in duration-300">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 border border-blue-200 text-blue-600 text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-sm">
                           <Loader2 className="w-3 h-3 animate-spin inline-block" />
                           Crafting...
                        </div>
                     </div>
                 )}
                  {((step === 'generate' && (galleryStatus === 'COMPLETE' || editingVaultAssetId)) || step === 'confirm') && (
                     <div className="animate-in fade-in slide-in-from-left-2 zoom-in duration-300">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00D084]/10 border border-[#00D084]/20 text-[#00D084] text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-sm">
                           <span className="relative flex h-2 w-2 align-middle">
                             <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D084]"></span>
                           </span>
                           Vault Asset
                        </div>
                     </div>
                 )}
              </div>
              <p className="text-sm font-medium opacity-70 transition-all max-w-xl" style={{ color: config.colors.text }}>
                 {step === 'style' && 'Select the artistic style for your figurine, then start crafting.'}
                 {step === 'generate' && 'Capturing every detail of your photo. This takes about a minute.'}
                 {step === 'confirm' && 'Review your figurine and choose your preferred size to place your order.'}
              </p>
           </div>

           {/* Right: Micro Steps Indicator */}
           <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1.5 rounded-full border border-black/10 dark:border-white/10 shrink-0">
              {['upload', 'style', 'generate', 'confirm'].map((s, i) => {
                 const isActive = step === s;
                 const isPast = ['upload', 'style', 'generate', 'confirm'].indexOf(step) > i;
                 
                 return (
                     <div key={s} className="flex items-center" title={`Step ${i+1}`}>
                        <div 
                           className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${isActive ? 'text-white scale-110' : isPast ? 'bg-transparent text-[#00D084]' : 'bg-transparent'}`}
                           style={{ 
                              backgroundColor: isActive ? config.colors.primary : undefined,
                              color: !isActive && !isPast ? config.colors.textMuted : undefined 
                           }}
                        >
                           {isPast ? '✓' : i + 1}
                        </div>
                        {i < 3 && <div className={`w-3 sm:w-6 h-[2px] mx-1 rounded-full transition-colors ${isPast ? 'bg-[#00D084]' : 'bg-black/10 dark:bg-white/10'}`} />}
                     </div>
                 )
              })}
           </div>
        </div>
        )}

        {/* Step 2: 风格选择 + 正式启动 */}
        {step === 'style' && uploadedImage && (
          <div className={`p-6 sm:p-8 ${styles.card} relative`} style={{ backgroundColor: config.colors.background }}>
            {/* 返回修改照片 */}
            <div className="mb-6 flex items-start">
              <button
                onClick={() => setStep('upload')}
                className="text-sm font-medium opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-black/5 dark:bg-white/5 py-1.5 px-3 rounded-md"
                style={{ color: config.colors.text }}
              >
                ← Change Photo
              </button>
            </div>

            <div className="grid gap-8 md:grid-cols-[148px_1fr] items-start">
              {/* 左：已上传照片预览 */}
              <div className="hidden md:flex flex-col items-center gap-2">
                <div className="w-36 h-48 rounded-2xl overflow-hidden border-2 shadow-sm" style={{ borderColor: config.colors.border }}>
                  <ClickableImage src={uploadedImage} alt="Your photo" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-medium opacity-50" style={{ color: config.colors.textMuted }}>Your photo</p>
              </div>

              {/* 右：风格选择 */}
              <div className="space-y-6">
                {/* 大类 */}
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest mb-3 opacity-40" style={{ color: config.colors.text }}>
                    Select Style
                  </p>
                  {isLoadingStyles ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[0,1,2,3].map(i => (
                        <div key={i} className="h-24 rounded-xl animate-pulse" style={{ backgroundColor: config.colors.backgroundAlt }} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {styleCategories.map((cat) => {
                        const iconMap: Record<string, React.ReactNode> = {
                          Smile: <Smile className="w-6 h-6" />,
                          Triangle: <Triangle className="w-6 h-6" />,
                          Box: <Box className="w-6 h-6" />,
                          Aperture: <Aperture className="w-6 h-6" />,
                        };
                        const isCatSelected = selectedCategoryId === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategoryId(cat.id);
                              setSelectedPresetId(cat.presets[0].id);
                            }}
                            className={`relative flex flex-col items-center justify-center gap-2.5 py-5 px-2 rounded-2xl border-2 transition-all duration-200 cursor-pointer active:scale-95 ${
                              isCatSelected
                                ? 'shadow-sm'
                                : 'border-transparent hover:border-black/10 dark:hover:border-white/10'
                            }`}
                            style={isCatSelected
                              ? { borderColor: config.colors.primary, backgroundColor: config.colors.backgroundAlt }
                              : { backgroundColor: config.colors.backgroundAlt }
                            }
                          >
                            {!cat.isOrderable && (
                              <span className="absolute top-2 right-2 text-[8px] font-semibold uppercase tracking-wider bg-black/8 text-black/40 dark:bg-white/10 dark:text-white/40 px-1.5 py-0.5 rounded-full leading-none">
                                Preview
                              </span>
                            )}
                            <div
                              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200"
                              style={{
                                backgroundColor: isCatSelected ? config.colors.primary + '18' : 'transparent',
                                color: isCatSelected ? config.colors.primary : config.colors.textMuted,
                              }}
                            >
                              {iconMap[cat.icon] ?? <span className="text-base font-bold">{cat.displayName.charAt(0)}</span>}
                            </div>
                            <span
                              className="text-xs font-semibold transition-colors"
                              style={{ color: isCatSelected ? config.colors.text : config.colors.textMuted }}
                            >
                              {cat.displayName}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 小类 variant pills */}
                {(() => {
                  const activeCat = styleCategories.find(c => c.id === selectedCategoryId);
                  if (!activeCat || activeCat.presets.length <= 1) return null;
                  return (
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest mb-2.5 opacity-40" style={{ color: config.colors.text }}>
                        Style Variant
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {activeCat.presets.map((preset) => {
                          const isPresetSelected = selectedPresetId === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setSelectedPresetId(preset.id)}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer active:scale-95 ${
                                isPresetSelected
                                  ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white shadow-sm'
                                  : 'border-black/15 dark:border-white/15 hover:border-black/30 dark:hover:border-white/30 hover:bg-black/5 dark:hover:bg-white/5'
                              }`}
                              style={isPresetSelected ? {} : { color: config.colors.textMuted }}
                            >
                              {isPresetSelected && <Check className="w-3 h-3" />}
                              {preset.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Start Crafting 按钮 — 正式启动 */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (!session) {
                        if (uploadedImage) {
                          sessionStorage.setItem('pendingCustomFigurineImage', uploadedImage);
                        }
                        toast(t('loginRequired') as string);
                        setLoginModalOpen(true);
                        return;
                      }
                      setStep('generate');
                    }}
                    className={`w-full flex items-center justify-center gap-3 py-4 text-base font-bold rounded-2xl transition-all ${styles.button} hover:scale-[1.01] active:scale-[0.99]`}
                  >
                    <Sparkles className="w-5 h-5" />
                    Start Crafting My Figurine
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  {!selectedCategoryIsOrderable && (
                    <p className="mt-2 text-xs text-center opacity-50" style={{ color: config.colors.text }}>
                      Preview style — generation is available but ordering is not yet open.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

        )}

        {/* Step 1: 上传图片 */}

        {step === 'upload' && (
          <div id="upload-card" className={`p-8 ${styles.card} relative`} style={{ backgroundColor: config.colors.background }}>
            {/* Upload 步骤标题 */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-1" style={{ color: config.colors.text }}>Upload Your Photo</h1>
              <p className="text-sm opacity-60" style={{ color: config.colors.textMuted }}>Your figurine will be crafted from this photo</p>
            </div>
            {!uploadedImage ? (
                <>
                <div
                  className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-all duration-200 cursor-pointer ${
                    isDragging
                      ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-900/20 scale-[1.02] shadow-lg shadow-purple-500/10'
                      : 'hover:bg-gray-50/50'
                  }`}
                  style={isDragging ? {} : { borderColor: config.colors.border }}
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className={`mb-4 h-10 w-10 transition-all duration-200 ${isDragging ? 'opacity-90 scale-110 -translate-y-1' : 'opacity-70'}`} style={{ color: isDragging ? '#a855f7' : config.colors.primary }} />
                  <p className="mb-2 text-center font-medium" style={{ color: config.colors.text }}>
                    {isDragging ? 'Drop your image here' : (t('uploadTitle') || '点击或拖拽上传图片')}
                  </p>
                  <p className="text-center text-xs opacity-60" style={{ color: config.colors.textMuted }}>
                    {isDragging ? 'Release to start processing' : (t('uploadFormats') || '支持 JPG, PNG, WEBP (建议竖版)')}
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden"
                  />
                </div>
                {/* 拍摄提示 */}
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  {[
                    'Full body or clear subject',
                    'Simple or plain background',
                    'Good lighting — no harsh shadows',
                    'Face clearly visible',
                  ].map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: config.colors.backgroundAlt }}>
                      <span className="mt-0.5 text-sm leading-none shrink-0" style={{ color: config.colors.primary }}>✦</span>
                      <span className="text-xs leading-relaxed" style={{ color: config.colors.textMuted }}>{tip}</span>
                    </div>
                  ))}
                </div>
                </>
            ) : (
                <div className="mt-8 flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
                    <div className="w-full max-h-80 overflow-hidden rounded-xl border flex items-center justify-center bg-gray-50/50 relative" style={{ borderColor: config.colors.border }}>
                        <ClickableImage 
                           src={uploadedImage} 
                           alt="Preview" 
                           className="object-contain max-h-[300px] w-auto h-auto rounded-lg" 
                        />
                        {/* 抠图进度覆盖层 */}
                        {bgProcessing && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-xl transition-all z-10">
                            <Loader2 className="h-6 w-6 animate-spin text-white mb-2" />
                            <p className="text-white text-xs font-medium mb-2">
                              {bgProgress?.stage === 'downloading' ? '⬇ Downloading AI Model…' : '✨ Removing Background…'}
                            </p>
                            <div className="w-3/5 h-1.5 bg-white/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${Math.round((bgProgress?.progress ?? 0) * 100)}%` }}
                              />
                            </div>
                            <p className="text-white/60 text-[10px] mt-1.5">
                              {Math.round((bgProgress?.progress ?? 0) * 100)}%
                            </p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                bgCancelledRef.current = true;
                                setBgProcessing(false);
                                setBgProgress(null);
                                setBgFilterEnabled(false);
                                if (bgOriginal) setUploadedImage(bgOriginal);
                              }}
                              className="mt-3 text-white/50 hover:text-white text-[10px] underline underline-offset-2 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                    </div>
{/* ── BG Segmented Control ── */}
                    {isBgRemovalEnabled() && bgOriginal && (() => {
                      // 公共样式：选中/未选中
                      const activeClass = 'bg-white dark:bg-white/10 shadow-sm';
                      const inactiveClass = 'hover:bg-black/5 dark:hover:bg-white/5';


                      return (
                        <div
                          className="relative flex rounded-2xl p-1 gap-1"
                          style={{ backgroundColor: config.colors.backgroundAlt ?? '#f0f0f0' }}
                        >
                          {/* ── Original 段 ── */}
                          <button
                            type="button"
                            disabled={bgProcessing}
                            onClick={() => { setBgFilterEnabled(false); setUploadedImage(bgOriginal); }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all duration-200
                              ${!bgFilterEnabled && !bgProcessing ? activeClass : inactiveClass}
                              ${bgProcessing ? 'opacity-30 cursor-not-allowed' : ''}
                            `}
                            style={{ color: !bgFilterEnabled && !bgProcessing ? config.colors.text : config.colors.textMuted }}
                          >
                            <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                            <span>Original</span>
                          </button>

                          {/* ── BG Removed 段 ── */}
                          <button
                            type="button"
                            disabled={bgProcessing}
                            onClick={() => {
                              if (bgProcessed) {
                                setBgFilterEnabled(true);
                                setUploadedImage(bgProcessed);
                              } else if (bgSourceRef.current) {
                                bgCancelledRef.current = false;
                                setBgProcessing(true);
                                setBgProgress(null);
                                setBgFilterEnabled(true);
                                const pngSrc = bgSourceRef.current;
                                setTimeout(() => {
                                  removeImageBackground(pngSrc, (p) => setBgProgress(p)).then(async (result) => {
                                    setBgProcessing(false);
                                    setBgProgress(null);
                                    if (bgCancelledRef.current) return;
                                    if (result.wasProcessed) {
                                      const jpegResult = await downgradeToJpeg(result.processedImageUrl);
                                      setBgProcessed(jpegResult);
                                      setUploadedImage(jpegResult);
                                    }
                                  });
                                }, 50);
                              }
                            }}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all duration-200
                              ${bgFilterEnabled || bgProcessing ? activeClass : inactiveClass}
                              ${bgProcessing ? 'cursor-not-allowed' : ''}
                            `}
                            style={{ color: bgProcessing ? '#00b37a' : bgFilterEnabled && bgProcessed ? '#00b37a' : config.colors.textMuted }}
                          >
                            {bgProcessing ? (
                              <>
                                <span className="relative flex h-3 w-3 shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-50" />
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                                </span>
                                <span>{bgProgress ? `${Math.round(bgProgress.progress * 100)}%` : 'Removing BG…'}</span>
                              </>
                            ) : bgProcessed ? (
                              <>
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                <span>BG Removed</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                <div className="flex flex-col items-center leading-tight">
                                  <span>Remove BG</span>
                                  <span className="text-[9px] font-normal opacity-40">~10-30s</span>
                                </div>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })()}


                       <div className="flex flex-col sm:flex-row gap-4 w-full">

                         <button

                           onClick={() => {

                             setUploadedImage(null);

                             setBgOriginal(null);

                             setBgProcessed(null);

                             setBgProcessing(false);

                             bgSourceRef.current = null;

                           }}

                           className="flex-1 rounded-full border py-3.5 text-sm font-medium hover:bg-black/5 transition-all"

                           style={{ borderColor: config.colors.border, color: config.colors.text }}

                         >

                           Change Photo

                         </button>

                         <button

                           onClick={() => {
                             if (!session) {
                               if (uploadedImage) {
                                 sessionStorage.setItem('pendingCustomFigurineImage', uploadedImage);
                               }
                               toast(t('loginRequired') as string);
                               setLoginModalOpen(true);
                               return;
                             }
                             setStep('style');
                           }}

                           disabled={bgProcessing}

                           className={`flex-[2] flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all ${bgProcessing ? 'rounded-full opacity-50 cursor-not-allowed bg-black/20 text-white' : styles.button}`}

                         >

                           {bgProcessing

                             ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing photo...</>

                             : <>Continue <ArrowRight className="h-4 w-4" /></>

                           }

                         </button>

                     </div>
                 </div>

            )}
          </div>
        )}

        {/* Step 2: 生成中 (Interactive Multi-View Gallery) */}
        {step === 'generate' && uploadedImage && (
          <div className="w-full relative z-20">
             <FigurineGenerationGallery 
                subjectImageB64={uploadedImage}
                 originalImageForShowcase={bgOriginal || uploadedImage}
                stylePrompt={selectedPreset?.primaryPrompt}
                styleModelId={selectedPreset?.aiModelId}
                styleCategorySlug={selectedCategory?.id}
                stylePresetSlug={selectedPreset?.id}
                initialViews={generatedViews}
                onCancel={() => {
                   if (editingVaultAssetId) {
                      router.push('/profile');
                      setTimeout(() => resetGenerationFlow(), 100);
                   } else {
                      setStep('style');
                      setGeneratedImage(null);
                      setGeneratedViews(null);
                      setGenerationStatus('idle');
                      setGalleryStatus('IDLE');
                   }
                }}
                onComplete={(urls: { primary: string, back: string, side: string }, asyncAssetId?: string) => {
                   setGeneratedImage(urls.primary); 
                   setGeneratedViews(urls);                   
                   setGenerationStatus('success');
                   setStep('confirm');
                   setGalleryStatus('COMPLETE');
                   
                   // Firewall: Prevent duplicate creation if we are modifying an existing vault asset
                   if (!editingVaultAssetId) {
                       // 修复: 彻底切断冗余数据库调用。如果 Gallery 已从后台获取了异步 AssetID，直接绑定！
                       if (asyncAssetId) {
                          setEditingVaultAssetId(asyncAssetId);
                       } else {
                          // Fallback just in case, though this should rarely hit now.
                          saveGeneratedAsset({
                             originalImageB64: uploadedImage,
                             primaryImageB64: urls.primary,
                             backImageB64: urls.back,
                             sideImageB64: urls.side,
                             prompt: undefined,
                             baseModelVariantId: selectedVariant?.id
                          }).then(res => {
                             if (res.success && res.assetId) {
                                setEditingVaultAssetId(res.assetId); // Bind session permanently
                             }
                          }).catch(console.error);
                       }
                   }
                }}
                onStatusChange={(status) => {
                   setGalleryStatus(status);
                }}
             />
          </div>
        )}

        {/* Step 3: 确认 & 选择规格 */}
        {step === 'confirm' && (
          <div id="upload-card" className={`p-8 ${styles.card} relative`} style={{ backgroundColor: config.colors.background }}>
            <div className="mb-6 flex items-start">
              <button 
                 onClick={() => setStep('generate')} 
                 className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/5 dark:bg-white/5 py-1.5 px-3 rounded-md"
                 style={{ color: config.colors.text }}
              >
                 ← Back to figurine
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* 图片 */}
              <div className="space-y-4">
                <div className={`rounded-xl border p-4`} style={{ borderColor: config.colors.border }}>
                  {(generatedImage || uploadedImage) && <ClickableImage src={generatedImage || uploadedImage!} alt="Your design" className="w-full rounded-lg" />}
                </div>
                {uploadedImage && (
                   <div className="rounded-xl p-4" style={{ backgroundColor: config.colors.backgroundAlt }}>
                     <h3 className="flex items-center gap-2 font-semibold" style={{ color: config.colors.text }}>
                       <ImageIcon className="h-4 w-4" />
                       {t('originalImage')}
                     </h3>
                     <ClickableImage src={uploadedImage} alt="Original" className="mt-2 h-32 w-full rounded-lg object-cover" />
                   </div>
                )}
              </div>

               {/* 规格选择 + 详情 */}
              <div className="space-y-4">
                {/* 商品规格选项 */}
                {isLoadingProducts ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: config.colors.textMuted }} />
                  </div>
                ) : product ? (
                  <div className={`rounded-xl border p-5 space-y-5`} style={{ borderColor: config.colors.border }}>
                    {product.options.map((option) => (
                      <div key={option.name}>
                        <h3 className="mb-3 text-sm font-semibold tracking-wide uppercase opacity-60" style={{ color: config.colors.text }}>{option.name}</h3>
                        <div className="flex flex-wrap gap-2.5">
                          {option.values.map((value) => {
                            const isSelected = selectedOptions[option.name] === value;
                            const isAvailable = isOptionValueAvailable(option.name, value);
                            return (
                              <button
                                key={value}
                                onClick={() => isAvailable && handleOptionChange(option.name, value)}
                                disabled={!isAvailable}
                                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
                                  !isAvailable
                                    ? 'opacity-30 cursor-not-allowed line-through'
                                    : isSelected
                                      ? 'cursor-pointer border-transparent bg-black text-white shadow-md dark:bg-white dark:text-black'
                                      : 'cursor-pointer hover:border-gray-400 hover:bg-black/5 dark:hover:bg-white/10'
                                }`}
                                style={isSelected && isAvailable ? {} : { borderColor: config.colors.border, color: config.colors.textMuted }}
                              >
                                {value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}


                <div className="rounded-xl border-2 p-4" style={{ borderColor: config.colors.primary }}>
                  <div className="flex items-center justify-between">
                    <span style={{ color: config.colors.textMuted }}>Total:</span>
                    <span className="text-3xl font-bold" style={{ color: config.colors.primary }}>
                      ${selectedVariant?.price.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl p-4" style={{ backgroundColor: '#eff6ff' }}>
                  <h3 className="mb-2 font-semibold" style={{ color: '#1e40af' }}>{t('whatHappensNext')}</h3>
                  <ul className="space-y-2 text-sm" style={{ color: '#1e3a8a' }}>
                    {Array.isArray(stepsList) && stepsList.map((step: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-[11px] leading-relaxed opacity-50 mt-1 px-1" style={{ color: config.colors.textMuted }}>
                  Each figurine is crafted for a single subject by default. Photos with multiple subjects may require additional review.
                </p>

                {isAddedToCart ? (
                    <div className="flex flex-col gap-3 mt-4">
                        <button
                          disabled
                          className={`flex w-full items-center justify-center gap-2 py-4 text-lg font-medium rounded-full bg-[#00D084]/10 text-[#00D084] border border-[#00D084]/20 cursor-default shadow-sm transition-all`}
                        >
                          <Check className="w-5 h-5" /> Added to Cart
                        </button>
                        <button
                          onClick={() => {
                             resetGenerationFlow();
                             setStep('upload');
                             setIsAddedToCart(false);
                          }}
                          className={`flex w-full items-center justify-center gap-2 py-4 text-lg font-medium border-2 hover:bg-black/5 dark:hover:bg-white/5 transition-all rounded-full`}
                          style={{ borderColor: config.colors.primary, color: config.colors.primary }}
                        >
                          <Sparkles className="w-5 h-5" /> Create Another Figurine
                        </button>
                    </div>
                ) : selectedCategoryIsOrderable ? (
                    <button
                      onClick={handleAddToCart}
                      className={`flex w-full items-center justify-center gap-2 py-4 mt-4 text-lg font-medium ${styles.button}`}
                    >
                      {t('addToCart')}
                    </button>
                ) : (
                    <div className="mt-4 space-y-3">
                      <button
                        disabled
                        className="flex w-full items-center justify-center gap-2 py-4 text-lg font-medium rounded-full cursor-not-allowed opacity-40"
                        style={{ backgroundColor: config.colors.backgroundAlt, color: config.colors.textMuted }}
                      >
                        Ordering not yet available for this style
                      </button>
                      <p className="text-xs text-center font-medium" style={{ color: config.colors.textMuted }}>
                        This style is in preview. Switch to Cartoon, Low Poly or Sculpture to place an order.
                      </p>
                    </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
