'use client';

import Link from 'next/link';
import { ArrowRight, Upload, Sparkles, Package, Star, Shield, Truck, ChevronDown, ChevronUp, Check, Sparkles as SparklesIcon } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { useThemeConfig } from '@/lib/useTheme';
import { translations } from '@/lib/i18n';
import { ImageSlider } from '@/components/ImageSlider';
import React, { useState, useMemo } from 'react';

export default function Home() {
  const { t: translate, language } = useTranslation();
  const { config, theme } = useThemeConfig();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [sliderPos, setSliderPos] = useState(50);

  const handleHeroMove = (e: React.MouseEvent | React.TouchEvent) => {
    let clientX: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }
    const percent = Math.max(0, Math.min((clientX / window.innerWidth) * 100, 100));
    setSliderPos(percent);
  };

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
      button: 'rounded-full bg-black text-white hover:bg-gray-800 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300',
      card: 'rounded-2xl border shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-md',
      section: '',
      sectionAlt: 'bg-gray-50/50',
    };
  };

  const styles = getThemeStyles();

  // 精选参考图 (手办、玩具模型、雕塑)
  const sampleImages = [
    'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=500&h=600&fit=crop', // 尤达宝宝模型
    'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?w=400&h=400&fit=crop', // 宇航员精细模型
    'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=400&h=400&fit=crop', // 木质素模假人
  ];

  const craftImages = [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop', // 3D Printing
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop', // Hand Painting
    'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&h=300&fit=crop', // Quality Check
    'https://images.unsplash.com/photo-1607227063002-677dc5fdf96f?w=400&h=300&fit=crop', // Safe Packing
  ];

  const scenarioImages = [
    'https://images.unsplash.com/photo-1606836591695-4d58a73eba1e?w=500&h=400&fit=crop', // 礼物盒
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=500&h=400&fit=crop', // 宠物狗
    'https://images.unsplash.com/photo-1606660265514-358ebbadc80d?w=500&h=400&fit=crop', // 动漫模型展示
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500&h=400&fit=crop', // 告白/情侣
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
      <section 
        className="relative overflow-hidden min-h-[90vh] flex items-center" 
        style={{ backgroundColor: config.colors.backgroundAlt }}
        onMouseMove={handleHeroMove}
        onTouchMove={handleHeroMove}
      >
        {/* Animated Background Gradients */}
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-purple-200/40 to-blue-200/40 rounded-full blur-3xl animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-gradient-to-tl from-yellow-200/40 to-pink-200/40 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="grid items-center gap-12 md:grid-cols-2 lg:gap-16">
            {/* 左侧：文字内容 */}
            <div className="flex flex-col items-start animate-slide-up-fade">
              <div className="inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full mb-6 bg-white/50 backdrop-blur-sm border shadow-sm" style={{ borderColor: config.colors.border }}>
                <SparklesIcon className="h-4 w-4" style={{ color: config.colors.primary }} />
                <span>New: AI-Powered 3D Generation</span>
              </div>
              <h1 className="mb-6 text-5xl font-extrabold leading-[1.1] md:text-6xl lg:text-7xl tracking-tight" style={{ color: config.colors.text }}>
                {t('heroTitle')}
              </h1>
              <p className="mb-8 text-xl leading-relaxed text-gray-500 max-w-lg" style={{ color: config.colors.textMuted }}>
                {t('heroSubtitle')}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/customize" className={`inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium ${styles.button}`} style={{ backgroundColor: config.colors.primary, color: '#fff' }}>
                  {t('startCustomizing')} <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="#how-it-works" className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium rounded-full border-2 hover:bg-gray-50 transition-colors" style={{ borderColor: config.colors.border, color: config.colors.text }}>
                  Learn More
                </Link>
              </div>

              {/* 信任徽章 */}
              <div className="mt-12 flex flex-wrap gap-8 pt-8 border-t" style={{ borderColor: config.colors.border }}>
                <div className="flex items-center gap-3 group">
                  <div className="p-3 rounded-xl bg-white shadow-sm group-hover:scale-110 transition-transform">
                    <Shield className="h-6 w-6" style={{ color: config.colors.primary }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: config.colors.textMuted }}>Quality<br/>Guaranteed</span>
                </div>
                <div className="flex items-center gap-3 group">
                  <div className="p-3 rounded-xl bg-white shadow-sm group-hover:scale-110 transition-transform">
                    <Truck className="h-6 w-6" style={{ color: config.colors.primary }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: config.colors.textMuted }}>Worldwide<br/>Shipping</span>
                </div>
              </div>
            </div>

            {/* 右侧：参考图展示 */}
            <div className="relative animate-fade-in mt-12 md:mt-0 lg:ml-10">
              <div className="animate-float" style={{ animationDelay: '0.5s' }}>
                <div className={`relative mx-auto w-full max-w-md ${styles.card} p-2`} style={{ backgroundColor: config.colors.background, transform: 'rotate(-2deg)' }}>
                  <ImageSlider
                    beforeImage="/images/before_sketch.png"
                    afterImage="/images/after_photo.jpg"
                    className="aspect-[4/5] shadow-inner"
                    beforeLabel="Sketch"
                    afterLabel="Figurine"
                    position={sliderPos}
                  />
                  <div className="absolute -bottom-6 -left-6 rounded-2xl px-6 py-4 font-semibold shadow-xl flex items-center gap-3 backdrop-blur-md bg-white/90 border border-white/20 z-40">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white">
                      <SparklesIcon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-500">Slide to compare</span>
                      <span className="text-gray-900" style={{ color: config.colors.primary }}>100% Custom</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-12 top-12 w-40 z-20 hidden md:block animate-float" style={{ animationDelay: '1s' }}>
                <div className={`overflow-hidden rounded-2xl shadow-2xl ${styles.card} p-1`} style={{ backgroundColor: config.colors.background, transform: 'rotate(-8deg)' }}>
                  <div className="rounded-xl overflow-hidden">
                    <img src={sampleImages[1]} alt="Sample 2" className="h-40 w-full object-cover hover:scale-110 transition-transform duration-500" />
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-10 -right-8 w-48 z-20 hidden md:block animate-float" style={{ animationDelay: '1.5s' }}>
                <div className={`overflow-hidden rounded-2xl shadow-2xl ${styles.card} p-1`} style={{ backgroundColor: config.colors.background, transform: 'rotate(5deg)' }}>
                  <div className="rounded-xl overflow-hidden">
                    <img src={sampleImages[2]} alt="Sample 3" className="h-48 w-full object-cover hover:scale-110 transition-transform duration-500" />
                  </div>
                </div>
              </div>

              <div className="absolute right-0 top-1/4 z-30 animate-float" style={{ animationDelay: '0.2s' }}>
                <div className="flex flex-col items-center gap-1 rounded-2xl px-5 py-4 shadow-xl backdrop-blur-md bg-white/90 border border-white/20">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((i) => (<Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400 drop-shadow-sm" />))}
                  </div>
                  <span className="text-sm font-bold text-gray-900">4.9/5 Rating</span>
                  <span className="text-xs text-gray-500">Over 2k happy customers</span>
                </div>
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
                <img src={scenarioImages[0]} alt="Gifts" className="w-full rounded-xl object-cover" style={{ height: '200px' }} />
                <img src={scenarioImages[1]} alt="Pets" className="w-full rounded-xl object-cover" style={{ height: '150px' }} />
              </div>
              <div className="space-y-4 pt-8">
                <img src={scenarioImages[2]} alt="Collections" className="w-full rounded-xl object-cover" style={{ height: '150px' }} />
                <img src={scenarioImages[3]} alt="Wedding & Couples" className="w-full rounded-xl object-cover" style={{ height: '200px' }} />
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
      <section id="how-it-works" className="py-24" style={{ backgroundColor: config.colors.background }}>
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
