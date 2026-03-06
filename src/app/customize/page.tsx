'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles, Loader2, ArrowRight, Check, Image as ImageIcon } from 'lucide-react';
import { useStore } from '@/lib/store';
import { getProducts, Product, ProductVariant } from '@/lib/shopify';
import { useTranslation } from '@/lib/useTranslation';
import { useThemeConfig } from '@/lib/useTheme';

type Step = 'upload' | 'generate' | 'select' | 'confirm';

export default function CustomizePage() {
  const [step, setStep] = useState<Step>('upload');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t: translate } = useTranslation();
  const { config, theme } = useThemeConfig();

  // 简化的翻译函数，返回字符串
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (key: any): string => {
    return translate(key) as string;
  };

  // 选项状态
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const {
    uploadedImage,
    setUploadedImage,
    generatedImage,
    setGeneratedImage,
    generationStatus,
    setGenerationStatus,
    addToCart,
    setCartOpen,
  } = useStore();

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

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 模拟 AI 生成图片
  const handleGenerate = async () => {
    if (!uploadedImage) return;

    setGenerationStatus('generating');
    setStep('generate');

    // 模拟 API 延迟
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // 暂时使用上传的图片作为"生成"结果
    setGeneratedImage(uploadedImage);
    setGenerationStatus('success');
    setStep('select');
  };

  // 加入购物车
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
      button: 'rounded-full bg-black text-white hover:bg-gray-800',
      card: 'rounded-xl border shadow-sm',
      stepActive: 'bg-black text-white',
      stepCompleted: 'bg-green-500 text-white',
      stepInactive: 'bg-gray-200 text-gray-500',
    };
  };

  const styles = getThemeStyles();

  return (
    <main className="min-h-screen py-8" style={{ backgroundColor: config.colors.backgroundAlt }}>
      <div className="container mx-auto max-w-4xl px-4">
        {/* 步骤指示器 */}
        <div className="mb-8 flex justify-center">
          <div className="flex items-center gap-4">
            {['upload', 'generate', 'select', 'confirm'].map((s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    step === s
                      ? styles.stepActive
                      : ['upload', 'generate', 'select', 'confirm'].indexOf(step) > i
                      ? styles.stepCompleted
                      : styles.stepInactive
                  }`}
                >
                  {['upload', 'generate', 'select', 'confirm'].indexOf(step) > i ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 3 && <div className="h-0.5 w-8" style={{ backgroundColor: config.colors.border }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: 上传图片 */}
        {step === 'upload' && (
          <div className={`p-8 ${styles.card}`} style={{ backgroundColor: config.colors.background }}>
            <h1 className="mb-2 text-2xl font-bold" style={{ color: config.colors.text }}>{t('uploadTitle')}</h1>
            <p className="mb-6" style={{ color: config.colors.textMuted }}>{t('uploadDesc')}</p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-gray-50 py-16 transition-colors hover:bg-gray-100"
              style={{ borderColor: config.colors.border }}
            >
              {uploadedImage ? (
                <img src={uploadedImage} alt="Uploaded" className="max-h-64 rounded-lg object-contain" />
              ) : (
                <>
                  <Upload className="mb-4 h-12 w-12" style={{ color: config.colors.textMuted }} />
                  <p style={{ color: config.colors.textMuted }}>{t('uploadHint')}</p>
                  <p className="mt-2 text-sm" style={{ color: config.colors.textMuted }}>{t('uploadFormat')}</p>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {uploadedImage && (
              <button
                onClick={handleGenerate}
                className={`mt-6 flex w-full items-center justify-center gap-2 py-3 font-medium ${styles.button}`}
              >
                <Sparkles className="h-5 w-5" />
                {t('generateBtn')}
              </button>
            )}
          </div>
        )}

        {/* Step 2: 生成中 */}
        {step === 'generate' && (
          <div className={`p-8 ${styles.card}`} style={{ backgroundColor: config.colors.background }}>
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="mb-6 h-16 w-16 animate-spin" style={{ color: config.colors.primary }} />
              <h2 className="mb-2 text-2xl font-bold" style={{ color: config.colors.text }}>{t('generatingTitle')}</h2>
              <p style={{ color: config.colors.textMuted }}>{t('generatingDesc')}</p>
            </div>
          </div>
        )}

        {/* Step 3: 选择选项 */}
        {step === 'select' && (
          <div className={`p-8 ${styles.card}`} style={{ backgroundColor: config.colors.background }}>
            <h1 className="mb-2 text-2xl font-bold" style={{ color: config.colors.text }}>{t('chooseOptions')}</h1>
            <p className="mb-6" style={{ color: config.colors.textMuted }}>{t('uploadDesc')}</p>

            {/* 图片预览 */}
            <div className="mb-6 flex justify-center">
              <div className={`relative rounded-xl border p-4`} style={{ borderColor: config.colors.border }}>
                <img src={generatedImage || uploadedImage || ''} alt="Generated" className="max-h-64 rounded-lg" />
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
                onClick={() => {
                  setStep('upload');
                  setGeneratedImage(null);
                  setGenerationStatus('idle');
                }}
                className="flex-1 rounded-full border py-3 font-medium hover:bg-gray-50"
                style={{ borderColor: config.colors.border, color: config.colors.text }}
              >
                {t('backBtn')}
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
            <h1 className="mb-2 text-2xl font-bold" style={{ color: config.colors.text }}>{t('confirmTitle')}</h1>
            <p className="mb-6" style={{ color: config.colors.textMuted }}>{t('confirmDesc')}</p>

            <div className="grid gap-6 md:grid-cols-2">
              {/* 图片 */}
              <div className="space-y-4">
                <div className={`rounded-xl border p-4`} style={{ borderColor: config.colors.border }}>
                  <img src={generatedImage || uploadedImage || ''} alt="Your design" className="w-full rounded-lg" />
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: config.colors.backgroundAlt }}>
                  <h3 className="flex items-center gap-2 font-semibold" style={{ color: config.colors.text }}>
                    <ImageIcon className="h-4 w-4" />
                    {t('originalImage')}
                  </h3>
                  <img src={uploadedImage || ''} alt="Original" className="mt-2 h-32 w-full rounded-lg object-cover" />
                </div>
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

                <button
                  onClick={handleAddToCart}
                  className={`flex w-full items-center justify-center gap-2 py-4 text-lg font-medium ${styles.button}`}
                >
                  {t('addToCart')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
