'use client';

import Link from 'next/link';
import { ArrowRight, Upload, Sparkles, Package, Star, Shield, Truck, ChevronDown, ChevronUp, Check, Sparkles as SparklesIcon } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { useThemeConfig } from '@/lib/useTheme';
import { translations } from '@/lib/i18n';
import { useState, useMemo } from 'react';

export default function Home() {
  const { t: translate, language } = useTranslation();
  const { config, theme } = useThemeConfig();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const t = (key: any): string => {
    const value = translate(key);
    return typeof value === 'string' ? value : key;
  };

  const getThemeStyles = () => {
    if (theme === 'neo-brutalist') {
      return {
        button: 'border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all',
        card: 'border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white',
        section: 'bg-yellow-100',
        sectionAlt: 'bg-white',
      };
    }
    if (theme === 'minimal') {
      return {
        button: 'bg-black text-white hover:bg-gray-800 rounded-none',
        card: 'border border-gray-200 shadow-none rounded-none',
        section: '',
        sectionAlt: 'bg-gray-50',
      };
    }
    if (theme === 'elegant') {
      return {
        button: 'rounded-full bg-amber-900 text-white hover:bg-amber-800',
        card: 'border border-stone-200 shadow-sm rounded-xl',
        section: '',
        sectionAlt: 'bg-stone-50',
      };
    }
    if (theme === 'editorial') {
      return {
        button: 'rounded-none bg-black text-white hover:bg-gray-800 border-2 border-black',
        card: 'border border-gray-300 shadow-sm rounded-none',
        section: '',
        sectionAlt: 'bg-gray-100',
      };
    }
    if (theme === 'watercolor') {
      return {
        button: 'rounded-2xl bg-rose-300 text-white hover:bg-rose-400 shadow-md',
        card: 'border border-rose-200 shadow-md rounded-2xl',
        section: '',
        sectionAlt: 'bg-amber-50',
      };
    }
    // default
    return {
      button: 'rounded-full bg-black text-white hover:bg-gray-800',
      card: 'rounded-xl border shadow-sm',
      section: '',
      sectionAlt: 'bg-gray-50',
    };
  };

  const styles = getThemeStyles();

  // 临时参考图
  const sampleImages = [
    'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1563089145-599997674d42?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=400&fit=crop',
  ];

  const craftImages = [
    'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1565514020176-dbf227791267?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  ];

  const scenarioImages = [
    'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=500&h=400&fit=crop',
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&h=400&fit=crop',
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=500&h=400&fit=crop',
  ];

  // 根据语言获取翻译数据
  const currentTranslations = language === 'zh' ? translations.zh : translations.en;

  const craftList = currentTranslations.craftList || [
    { title: '3D Printing', desc: 'Using advanced SLA/DLP technology, we print each figurine with layer precision of just 25 microns, ensuring every detail is captured perfectly.' },
    { title: 'Hand Painting', desc: 'Our skilled artisans hand-paint each piece with precision, bringing your figurine to life with vibrant colors and meticulous attention to detail.' },
    { title: 'Quality Check', desc: 'Every figurine undergoes rigorous multi-stage quality inspection to ensure it meets our highest standards before shipping.' },
    { title: 'Safe Packing', desc: 'We use shock-proof packaging specifically designed for delicate figurines, ensuring safe delivery anywhere in the world.' }
  ];

  const processList = currentTranslations.processList || [
    { title: 'AI Generation', desc: 'Our AI transforms your photo into a stunning 3D render' },
    { title: '3D Modeling', desc: 'Create a precise digital model from the render' },
    { title: '3D Printing', desc: 'Print with high-quality resin materials' },
    { title: 'Hand Painting', desc: 'Paint with meticulous attention to detail' },
    { title: 'Quality Check', desc: 'Ensure perfect quality through inspection' },
    { title: 'Shipping', desc: 'Deliver safely to your door worldwide' }
  ];

  const faqList = currentTranslations.faqList || [
    { q: 'How long does it take?', a: 'Typically 2-3 weeks including production and shipping. Express options available for urgent orders.' },
    { q: 'What photo should I upload?', a: 'High-resolution, well-lit photos work best. Front-facing images with clear features produce the best results. Files up to 10MB accepted.' },
    { q: 'What sizes are available?', a: 'We offer 4 sizes: 6cm (small), 8cm (medium), 10cm (large), and 15cm (extra large). Each size includes different level of detail.' },
    { q: 'Do you ship internationally?', a: 'Yes! We ship worldwide with full tracking. Shipping times vary by location, typically 5-14 business days.' }
  ];

  const scenariosList = currentTranslations.scenariosList || [
    'Birthday gifts for loved ones',
    'Wedding & anniversary commemorations',
    'Pet portraits preserved forever',
    'Corporate branding & events',
    'Fan art & character collection'
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section - 左右分栏 */}
      <section className="relative overflow-hidden" style={{ backgroundColor: config.colors.backgroundAlt }}>
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid items-center gap-12 md:grid-cols-2 lg:gap-16">
            {/* 左侧：文字内容 */}
            <div className="flex flex-col items-start">
              <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl" style={{ color: config.colors.text }}>
                {t('heroTitle')}
              </h1>
              <p className="mb-8 text-lg md:text-xl" style={{ color: config.colors.textMuted }}>
                {t('heroSubtitle')}
              </p>
              <Link href="/customize" className={`inline-flex items-center gap-2 px-8 py-4 text-lg font-medium ${styles.button}`} style={{ backgroundColor: config.colors.primary, color: '#fff' }}>
                {t('startCustomizing')} <ArrowRight className="h-5 w-5" />
              </Link>

              {/* 信任徽章 */}
              <div className="mt-10 flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" style={{ color: config.colors.primary }} />
                  <span className="text-sm" style={{ color: config.colors.textMuted }}>Quality Guaranteed</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5" style={{ color: config.colors.primary }} />
                  <span className="text-sm" style={{ color: config.colors.textMuted }}>Worldwide Shipping</span>
                </div>
              </div>
            </div>

            {/* 右侧：参考图展示 */}
            <div className="relative">
              <div className={`relative mx-auto w-full max-w-md ${styles.card}`} style={{ backgroundColor: config.colors.background, transform: 'rotate(-2deg)' }}>
                <div className="aspect-square overflow-hidden">
                  <img src={sampleImages[0]} alt="Custom Figurine Sample" className="h-full w-full object-cover" />
                </div>
                <div className="absolute bottom-4 left-4 rounded-full px-4 py-2 text-sm font-medium text-white" style={{ backgroundColor: config.colors.primary }}>
                  Custom Figurine
                </div>
              </div>

              <div className={`absolute -left-8 top-8 w-32 overflow-hidden rounded-xl shadow-lg ${styles.card}`} style={{ backgroundColor: config.colors.background, transform: 'rotate(3deg)', zIndex: -1 }}>
                <img src={sampleImages[1]} alt="Sample 2" className="h-32 w-full object-cover" />
              </div>

              <div className={`absolute -bottom-4 -right-4 w-28 overflow-hidden rounded-xl shadow-lg ${styles.card}`} style={{ backgroundColor: config.colors.background, transform: 'rotate(-5deg)', zIndex: -1 }}>
                <img src={sampleImages[2]} alt="Sample 3" className="h-28 w-full object-cover" />
              </div>

              <div className="absolute -right-4 top-1/2 flex items-center gap-2 rounded-full px-4 py-2 shadow-lg" style={{ backgroundColor: config.colors.background }}>
                <div className="flex">
                  {[1,2,3,4,5].map((i) => (<Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />))}
                </div>
                <span className="text-sm font-medium" style={{ color: config.colors.text }}>4.9/5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 适用场景 - 放在产品介绍第一位 */}
      <section className="py-24" style={{ backgroundColor: config.colors.background }}>
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            {/* 左侧：文字 */}
            <div>
              <h2 className="mb-6 text-3xl font-bold md:text-4xl" style={{ color: config.colors.text }}>{t('scenarios')}</h2>
              <p className="mb-8 text-lg" style={{ color: config.colors.textMuted }}>
                A custom figurine is more than just a decoration — it's a meaningful gift that captures memories and emotions.
              </p>
              <div className="space-y-4">
                {(scenariosList || []).map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: config.colors.primary }}>
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span style={{ color: config.colors.text }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 右侧：图片网格 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img src={scenarioImages[0]} alt="Scenario 1" className="w-full rounded-xl object-cover" style={{ height: '200px' }} />
                <img src={scenarioImages[1]} alt="Scenario 2" className="w-full rounded-xl object-cover" style={{ height: '150px' }} />
              </div>
              <div className="space-y-4 pt-8">
                <img src={scenarioImages[2]} alt="Scenario 3" className="w-full rounded-xl object-cover" style={{ height: '150px' }} />
                <img src={scenarioImages[0]} alt="Scenario 4" className="w-full rounded-xl object-cover" style={{ height: '200px' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 工艺介绍 */}
      <section className="py-24" style={{ backgroundColor: config.colors.backgroundAlt }}>
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl" style={{ color: config.colors.text }}>Premium Craftsmanship</h2>
            <p className="mx-auto max-w-2xl text-lg" style={{ color: config.colors.textMuted }}>
              Every figurine is a masterpiece created with precision technology and artistic dedication
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {craftList.map((item, i) => (
              <div key={i} className={`flex gap-6 ${styles.card}`} style={{ backgroundColor: config.colors.background }}>
                <div className="w-1/3 flex-shrink-0 overflow-hidden">
                  <img src={craftImages[i]} alt={item.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col justify-center py-4">
                  <h3 className="mb-2 text-xl font-semibold" style={{ color: config.colors.text }}>{item.title}</h3>
                  <p style={{ color: config.colors.textMuted }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 制作流程 - 时间线样式 */}
      <section className="py-24" style={{ backgroundColor: config.colors.background }}>
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl" style={{ color: config.colors.text }}>How It's Made</h2>
            <p className="mx-auto max-w-2xl text-lg" style={{ color: config.colors.textMuted }}>
              From your photo to your doorstep, we follow a meticulous process to create your perfect figurine
            </p>
          </div>

          {/* 移动端：简单垂直列表 */}
          <div className="space-y-6 md:hidden">
            {processList.map((item, i) => (
              <div key={i} className={`flex items-start gap-4 ${styles.card}`} style={{ backgroundColor: config.colors.background }}>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold text-white" style={{ backgroundColor: config.colors.primary }}>
                  {i + 1}
                </div>
                <div className="flex-1 pt-2">
                  <h3 className="mb-1 text-base font-semibold" style={{ color: config.colors.text }}>{item.title}</h3>
                  <p className="text-sm" style={{ color: config.colors.textMuted }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 桌面端：时间线布局 */}
          <div className="hidden md:block">
            <div className="relative mx-auto max-w-4xl">
              {/* 中间连接线 */}
              <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2" style={{ backgroundColor: config.colors.border }} />

              <div className="space-y-8">
                {processList.map((item: { title: string; desc: string }, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    {/* 左侧内容 - 偶数 */}
                    <div className="w-[45%]">
                      {i % 2 === 0 && (
                        <div className={`text-right ${styles.card} p-4 mr-4`} style={{ backgroundColor: config.colors.background }}>
                          <h3 className="mb-1 font-semibold" style={{ color: config.colors.text }}>{item.title}</h3>
                          <p className="text-sm" style={{ color: config.colors.textMuted }}>{item.desc}</p>
                        </div>
                      )}
                    </div>

                    {/* 中间圆点 */}
                    <div className="relative z-10 flex flex-shrink-0 items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white" style={{ backgroundColor: config.colors.primary }}>
                        {i + 1}
                      </div>
                    </div>

                    {/* 右侧内容 - 奇数 */}
                    <div className="w-[45%]">
                      {i % 2 !== 0 && (
                        <div className={`${styles.card} p-4 ml-4`} style={{ backgroundColor: config.colors.background }}>
                          <h3 className="mb-1 font-semibold" style={{ color: config.colors.text }}>{item.title}</h3>
                          <p className="text-sm" style={{ color: config.colors.textMuted }}>{item.desc}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 常见问题 - 精简版 */}
      <section className="py-20" style={{ backgroundColor: config.colors.backgroundAlt }}>
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-10 text-center text-3xl font-bold" style={{ color: config.colors.text }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqList.map((item, i) => (
              <div key={i} className={`cursor-pointer ${styles.card}`} style={{ backgroundColor: config.colors.background }} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <div className="flex items-center justify-between p-4">
                  <h3 className="font-medium" style={{ color: config.colors.text }}>{item.q}</h3>
                  {openFaq === i ? <ChevronUp className="h-5 w-5" style={{ color: config.colors.primary }} /> : <ChevronDown className="h-5 w-5" style={{ color: config.colors.textMuted }} />}
                </div>
                {openFaq === i && (
                  <div className="border-t px-4 pb-4" style={{ borderColor: config.colors.border }}>
                    <p className="pt-4" style={{ color: config.colors.textMuted }}>{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 text-3xl font-bold" style={{ color: config.colors.text }}>{t('ctaTitle')}</h2>
          <p className="mb-8 text-xl" style={{ color: config.colors.textMuted }}>{t('ctaSubtitle')}</p>
          <Link href="/customize" className={`inline-flex items-center gap-2 px-8 py-4 text-lg font-medium ${styles.button}`} style={{ backgroundColor: config.colors.primary, color: '#fff' }}>
            {t('getStarted')} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
