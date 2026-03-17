'use client';

import Link from 'next/link';
import { ArrowRight, Upload, Sparkles, Package, Star, Shield, Truck, ChevronDown, ChevronUp, Check, Sparkles as SparklesIcon } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { useThemeConfig } from '@/lib/useTheme';
import { translations } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { ImageSlider } from '@/components/ImageSlider';
import HeroShowcase from '@/components/home-themes/HeroShowcase';
import React, { useState, useMemo } from 'react';

export default function Home() {
  const { t: translate, language } = useTranslation();
  const { resetGenerationFlow } = useStore();
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

  // 绮鹃€夊弬鑰冨浘 (鎵嬪姙銆佺帺鍏锋ā鍨嬨€侀洉濉?
  const sampleImages = [
    'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=500&h=600&fit=crop', // 灏よ揪瀹濆疂妯″瀷
    'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?w=400&h=400&fit=crop', // 瀹囪埅鍛樼簿缁嗘ā鍨?
    'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=400&h=400&fit=crop', // 鏈ㄨ川绱犳ā鍋囦汉
  ];

  const craftImages = [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop', // 3D Printing
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop', // Hand Painting
    'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&h=300&fit=crop', // Quality Check
    'https://images.unsplash.com/photo-1607227063002-677dc5fdf96f?w=400&h=300&fit=crop', // Safe Packing
  ];

  const scenarioImages = [
    'https://images.unsplash.com/photo-1606836591695-4d58a73eba1e?w=500&h=400&fit=crop', // 绀肩墿鐩?
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=500&h=400&fit=crop', // 瀹犵墿鐙?
    'https://images.unsplash.com/photo-1606660265514-358ebbadc80d?w=500&h=400&fit=crop', // 鍔ㄦ极妯″瀷灞曠ず
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500&h=400&fit=crop', // 鍛婄櫧/鎯呬荆
  ];

  // 鏍规嵁璇█鑾峰彇缈昏瘧鏁版嵁
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
      {/* Hero Section - Showcase Carousel */}
      <HeroShowcase />

      {/* 閫傜敤鍦烘櫙 - 鏀惧湪浜у搧浠嬬粛绗竴浣?*/}
      <section className="py-24" style={{ backgroundColor: config.colors.background }}>
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            {/* 宸︿晶锛氭枃瀛?*/}
            <div>
              <h2 className="mb-6 text-3xl font-bold md:text-4xl" style={{ color: config.colors.text }}>{t('scenarios')}</h2>
              <p className="mb-8 text-lg" style={{ color: config.colors.textMuted }}>
                A custom figurine is more than just a decoration - it&apos;s a meaningful gift that captures memories and emotions.
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

            {/* 鍙充晶锛氬浘鐗囩綉鏍?*/}
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

      {/* 宸ヨ壓浠嬬粛 */}
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

      {/* 鍒朵綔娴佺▼ - 鏃堕棿绾挎牱寮?*/}
      <section id="how-it-works" className="py-24" style={{ backgroundColor: config.colors.background }}>
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl" style={{ color: config.colors.text }}>How It's Made</h2>
            <p className="mx-auto max-w-2xl text-lg" style={{ color: config.colors.textMuted }}>
              From your photo to your doorstep, we follow a meticulous process to create your perfect figurine
            </p>
          </div>

          {/* 绉诲姩绔細绠€鍗曞瀭鐩村垪琛?*/}
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

          {/* 妗岄潰绔細鏃堕棿绾垮竷灞€ */}
          <div className="hidden md:block">
            <div className="relative mx-auto max-w-4xl">
              {/* 涓棿杩炴帴绾?*/}
              <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2" style={{ backgroundColor: config.colors.border }} />

              <div className="space-y-8">
                {processList.map((item: { title: string; desc: string }, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    {/* 宸︿晶鍐呭 - 鍋舵暟 */}
                    <div className="w-[45%]">
                      {i % 2 === 0 && (
                        <div className={`text-right ${styles.card} p-4 mr-4`} style={{ backgroundColor: config.colors.background }}>
                          <h3 className="mb-1 font-semibold" style={{ color: config.colors.text }}>{item.title}</h3>
                          <p className="text-sm" style={{ color: config.colors.textMuted }}>{item.desc}</p>
                        </div>
                      )}
                    </div>

                    {/* 涓棿鍦嗙偣 */}
                    <div className="relative z-10 flex flex-shrink-0 items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white" style={{ backgroundColor: config.colors.primary }}>
                        {i + 1}
                      </div>
                    </div>

                    {/* 鍙充晶鍐呭 - 濂囨暟 */}
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

      {/* 甯歌闂 - 绮剧畝鐗?*/}
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
          <Link href="/customize" onClick={() => resetGenerationFlow()} className={`inline-flex items-center gap-2 px-8 py-4 text-lg font-medium ${styles.button}`} style={{ backgroundColor: config.colors.primary, color: '#fff' }}>
            {t('getStarted')} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </main>
  );
}
