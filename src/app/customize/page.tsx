'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles, Loader2, ArrowRight, Check, Image as ImageIcon } from 'lucide-react';
import { useStore } from '@/lib/store';
import { getProducts, Product, ProductVariant } from '@/lib/shopify';
import { saveGeneratedAsset } from '@/app/actions/save-asset';
import { useTranslation } from '@/lib/useTranslation';
import { useThemeConfig } from '@/lib/useTheme';
import FigurineGenerationGallery from '@/components/ai/FigurineGenerationGallery';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

type Step = 'upload' | 'generate' | 'select' | 'confirm';

export default function CustomizePage() {
  const [step, setStep] = useState<Step>('upload');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t: translate } = useTranslation();
  const { config, theme } = useThemeConfig();
  const { data: session } = useSession();
  const router = useRouter();

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
     if (!uploadedImage && !editingVaultAssetId && step !== 'upload') {
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

  // 处理选项变更
  const handleOptionChange = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionName]: value,
    }));
  };

  // 处理文件上传并压缩 (Fix QuotaExceededError)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // We use a Promise to read and compress the image using Canvas
    const compressImage = (file: File, maxWidth: number): Promise<string> => {
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
            
            // Fill with white background in case of transparent PNG
            if (ctx) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
            }
            
            // Export as JPEG at 80% quality (drastically reduces base64 size for localStorage)
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          };
          img.onerror = reject;
          img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      const compressedBase64 = await compressImage(file, 1024); // 1K bounding box limit
      setUploadedImage(compressedBase64);
    } catch (error) {
      console.error("Failed to compress image:", error);
      alert(t('uploadError') || 'Failed to process image');
    }
  };

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

  // 获取主题样式
  const getThemeStyles = () => {
    if (theme === 'neo-brutalist') {
      return {
        button: 'border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all',
        card: 'border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white',
        stepActive: 'bg-black text-white',
        stepCompleted: 'bg-green-500 text-white',
        stepInactive: 'bg-gray-200 text-gray-500',
      };
    }
    if (theme === 'minimal') {
      return {
        button: 'bg-black text-white hover:bg-gray-800 rounded-none',
        card: 'border border-gray-200 shadow-none rounded-none',
        stepActive: 'bg-black text-white',
        stepCompleted: 'bg-gray-500 text-white',
        stepInactive: 'bg-gray-200 text-gray-400',
      };
    }
    if (theme === 'elegant') {
      return {
        button: 'rounded-full bg-amber-900 text-white hover:bg-amber-800',
        card: 'border border-stone-200 shadow-sm rounded-xl',
        stepActive: 'bg-amber-900 text-white',
        stepCompleted: 'bg-green-600 text-white',
        stepInactive: 'bg-stone-200 text-stone-500',
      };
    }
    if (theme === 'editorial') {
      return {
        button: 'rounded-none bg-black text-white hover:bg-gray-800 border-2 border-black',
        card: 'border border-gray-300 shadow-sm rounded-none',
        stepActive: 'bg-black text-white',
        stepCompleted: 'bg-gray-600 text-white',
        stepInactive: 'bg-gray-200 text-gray-500',
      };
    }
    if (theme === 'watercolor') {
      return {
        button: 'rounded-2xl bg-rose-300 text-white hover:bg-rose-400 shadow-md',
        card: 'border border-rose-200 shadow-md rounded-2xl',
        stepActive: 'bg-rose-400 text-white',
        stepCompleted: 'bg-teal-400 text-white',
        stepInactive: 'bg-rose-200 text-rose-600',
      };
    }
    // default
    return {
      button: 'rounded-full bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300',
      card: 'rounded-2xl border shadow-lg bg-white/80 backdrop-blur-md animate-slide-up-fade',
      stepActive: 'bg-black text-white shadow-md ring-4 ring-gray-100',
      stepCompleted: 'bg-green-500 text-white shadow-md',
      stepInactive: 'bg-gray-100 text-gray-400',
    };
  };

  const styles = getThemeStyles();

  return (
    <main className={`min-h-screen relative overflow-hidden transition-all duration-700 ${step === 'generate' && galleryStatus === 'COMPLETE' ? 'py-4 sm:py-6' : 'py-12'}`} style={{ backgroundColor: config.colors.backgroundAlt }}>
      {/* Animated Background Gradients */}
      <div className="absolute top-0 right-0 w-full h-1/2 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
      <div className="absolute top-20 -left-20 w-96 h-96 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-gradient-to-l from-yellow-200/30 to-rose-200/30 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className={`w-full mx-auto px-4 sm:px-6 xl:px-8 relative z-10 transition-all duration-700 ${step === 'generate' && galleryStatus === 'COMPLETE' ? 'max-w-[1600px]' : 'max-w-4xl'}`}>
        
        {/* Professional Header Row with Steps & Security Badge */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-6 transition-all duration-500">
           {/* Left: Dynamic Step Title & Vault Status */}
           <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                 <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight transition-all" style={{ color: config.colors.text }}>
                    {step === 'upload' && (t('uploadTitle') || 'Initialize Core')}
                    {step === 'generate' && 'Virtualize Model'}
                    {step === 'select' && (t('chooseOptions') || 'Configure Specs')}
                    {step === 'confirm' && (t('confirmTitle') || 'Review Assets')}
                 </h1>
                 
                 {/* Security Badge inline with title */}
                 {step === 'generate' && (galleryStatus === 'GENERATING_PRIMARY' || galleryStatus === 'GENERATING_SECONDARY') && !editingVaultAssetId && (
                     <div className="animate-in fade-in slide-in-from-left-2 zoom-in duration-300">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff] text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-sm">
                           <Loader2 className="w-3 h-3 animate-spin inline-block" />
                           Generating...
                        </div>
                     </div>
                 )}
                 {((step === 'generate' && (galleryStatus === 'COMPLETE' || editingVaultAssetId)) || step === 'select' || step === 'confirm') && (
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
                 {step === 'upload' && (t('uploadDesc') || 'Upload your source subject to begin the 3D translation process.')}
                 {step === 'generate' && 'Vision Language Model is actively sculpting your parameters into a 3D mesh.'}
                 {step === 'select' && 'Select the physical crafting options, dimensions, and platform for your 3D model.'}
                 {step === 'confirm' && 'Final review of visual and physical parameters before dispatching to manufacturing.'}
              </p>
           </div>

           {/* Right: Micro Steps Indicator */}
           <div className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 p-1.5 rounded-full border border-black/10 dark:border-white/10 shrink-0">
              {['upload', 'generate', 'select', 'confirm'].map((s, i) => {
                 const isActive = step === s;
                 const isPast = ['upload', 'generate', 'select', 'confirm'].indexOf(step) > i;
                 
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

        {/* Step 1: 上传图片 */}
        {step === 'upload' && (
          <div className={`p-8 ${styles.card}`} style={{ backgroundColor: config.colors.background }}>
            {/* 恢复至极简文件上传，并设置严格的高度控制 */}
            {!uploadedImage ? (
                <div
                  className="mt-6 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 transition-colors hover:bg-gray-50/50 cursor-pointer"
                  style={{ borderColor: config.colors.border }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mb-4 h-10 w-10 opacity-70" style={{ color: config.colors.primary }} />
                  <p className="mb-2 text-center font-medium" style={{ color: config.colors.text }}>
                    {t('uploadTitle') || '点击或拖拽上传图片'}
                  </p>
                  <p className="text-center text-xs opacity-60" style={{ color: config.colors.textMuted }}>
                    {t('uploadFormats') || '支持 JPG, PNG, WEBP (建议竖版)'}
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden"
                  />
                </div>
            ) : (
                <div className="mt-8 flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
                    <div className="w-full max-h-80 overflow-hidden rounded-xl border flex items-center justify-center bg-gray-50/50" style={{ borderColor: config.colors.border }}>
                        {/* 限制最大高度，防止图片撑满整个屏幕 */}
                        <img 
                           src={uploadedImage} 
                           alt="Preview" 
                           className="object-contain max-h-[300px] w-auto h-auto rounded-lg" 
                        />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 w-full">
                        <button
                          onClick={() => setUploadedImage(null)}
                          className="flex-1 rounded-full border py-3.5 text-sm font-medium hover:bg-black/5 transition-all"
                          style={{ borderColor: config.colors.border, color: config.colors.text }}
                        >
                          重新选择
                        </button>
                        <button
                          onClick={() => handleGenerate(uploadedImage)}
                          className={`flex-[2] flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all ${styles.button}`}
                        >
                          <Sparkles className="h-4 w-4" /> 生成 3D 模型
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
                initialViews={generatedViews}
                onCancel={() => {
                   if (editingVaultAssetId) {
                      router.push('/profile');
                      setTimeout(() => resetGenerationFlow(), 100);
                   } else {
                      setStep('upload');
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
                   setStep('select');
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

        {/* Step 3: 选择选项 */}
        {step === 'select' && (
          <div className={`p-8 ${styles.card}`} style={{ backgroundColor: config.colors.background }}>
            {/* 图片预览 */}
            <div className="mb-6 flex justify-center">
              <div className={`relative rounded-xl border p-4`} style={{ borderColor: config.colors.border }}>
                {(generatedImage || uploadedImage) && (
                   <img src={generatedImage || uploadedImage!} alt="Generated" className="max-h-64 rounded-lg object-contain" />
                )}
                <div className="absolute bottom-6 left-6 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
                  AI Generated Preview
                </div>
              </div>
            </div>

            {/* 选项选择 */}
            {isLoadingProducts ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: config.colors.textMuted }} />
              </div>
            ) : product ? (
              <div className="space-y-6">
                {product.options.map((option) => (
                  <div key={option.name}>
                    <h3 className="mb-3 text-sm font-medium" style={{ color: config.colors.text }}>{option.name}</h3>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value) => {
                        const isSelected = selectedOptions[option.name] === value;
                        return (
                          <button
                            key={value}
                            onClick={() => handleOptionChange(option.name, value)}
                            className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                              isSelected ? 'border-black bg-black text-white' : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={isSelected ? {} : { borderColor: config.colors.border, color: config.colors.text }}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* 价格显示 */}
                <div className="mt-6 rounded-xl p-4" style={{ backgroundColor: config.colors.backgroundAlt }}>
                  <div className="flex items-center justify-between">
                    <span style={{ color: config.colors.textMuted }}>{t('selectProduct')}</span>
                    <span className="font-medium" style={{ color: config.colors.text }}>{selectedVariant?.title}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span style={{ color: config.colors.textMuted }}>Price:</span>
                    <span className="text-3xl font-bold" style={{ color: config.colors.primary }}>
                      ${selectedVariant?.price.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center" style={{ color: config.colors.textMuted }}>No product available</p>
            )}

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => setStep('generate')}
                className="flex-1 rounded-full border py-3 font-medium hover:bg-gray-50 transition-colors"
                style={{ borderColor: config.colors.border, color: config.colors.text }}
              >
                ← {t('backBtn')} (View renders)
              </button>
              <button
                onClick={() => setStep('confirm')}
                disabled={!selectedVariant}
                className={`flex-1 flex items-center justify-center gap-2 py-3 font-medium ${styles.button} disabled:opacity-50`}
              >
                {t('continueBtn')} <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: 确认 */}
        {step === 'confirm' && (
          <div className={`p-8 ${styles.card}`} style={{ backgroundColor: config.colors.background }}>
            <div className="mb-6 flex items-start">
              <button 
                 onClick={() => setStep('select')} 
                 className="text-sm font-medium opacity-70 hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/5 dark:bg-white/5 py-1.5 px-3 rounded-md"
                 style={{ color: config.colors.text }}
              >
                 ← 返回修改配置
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* 图片 */}
              <div className="space-y-4">
                <div className={`rounded-xl border p-4`} style={{ borderColor: config.colors.border }}>
                  {(generatedImage || uploadedImage) && <img src={generatedImage || uploadedImage!} alt="Your design" className="w-full rounded-lg" />}
                </div>
                {uploadedImage && (
                   <div className="rounded-xl p-4" style={{ backgroundColor: config.colors.backgroundAlt }}>
                     <h3 className="flex items-center gap-2 font-semibold" style={{ color: config.colors.text }}>
                       <ImageIcon className="h-4 w-4" />
                       {t('originalImage')}
                     </h3>
                     <img src={uploadedImage} alt="Original" className="mt-2 h-32 w-full rounded-lg object-cover" />
                   </div>
                )}
              </div>

              {/* 详情 */}
              <div className="space-y-4">
                <div className={`rounded-xl border p-4`} style={{ borderColor: config.colors.border }}>
                  <h3 className="mb-2 font-semibold" style={{ color: config.colors.text }}>{t('selectedOptions')}</h3>
                  {selectedVariant?.selectedOptions.map((opt) => (
                    <div key={opt.name} className="flex justify-between text-sm">
                      <span style={{ color: config.colors.textMuted }}>{opt.name}:</span>
                      <span className="font-medium" style={{ color: config.colors.text }}>{opt.value}</span>
                    </div>
                  ))}
                </div>

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
                ) : (
                    <button
                      onClick={handleAddToCart}
                      className={`flex w-full items-center justify-center gap-2 py-4 mt-4 text-lg font-medium ${styles.button}`}
                    >
                      {t('addToCart')}
                    </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
