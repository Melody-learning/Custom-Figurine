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
  const { t: translate } = useTranslation();
  const { resetGenerationFlow } = useStore();
  const { config } = useThemeConfig();
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

  const styles = {
    button: 'rounded-full bg-black text-white hover:bg-gray-800 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300',
    card: 'rounded-2xl border shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white/80 backdrop-blur-md',
    section: '',
    sectionAlt: 'bg-gray-50/50',
  };

  const sampleImages = [
    'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=500&h=600&fit=crop',
    'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=400&h=400&fit=crop',
  ];

  const craftImages = [
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1607227063002-677dc5fdf96f?w=400&h=300&fit=crop',
  ];

  const scenarioImages = [
    'https://images.unsplash.com/photo-1606836591695-4d58a73eba1e?w=500&h=400&fit=crop',
    'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=500&h=400&fit=crop',
    'https://images.unsplash.com/photo-1606660265514-358ebbadc80d?w=500&h=400&fit=crop',
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=500&h=400&fit=crop',
  ];

  const craftList = translations.en.craftList;
  const processList = translations.en.processList;
  const faqList = translations.en.faqList;
  const scenariosList = translations.en.scenariosList;

  return (
    <main className="min-h-screen">
      {/* Hero Section - Showcase Carousel */}
      <HeroShowcase />

      {/* Scenarios Section */}
      <section className="py-24" style={{ backgroundColor: config.colors.background }}>
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
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

      {/* Craftsmanship Section */}
      <section className="py-24" style={{ backgroundColor: config.colors.backgroundAlt }}>
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl" style={{ color: config.colors.text }}>Premium Craftsmanship</h2>
            <p className="mx-auto max-w-2xl text-lg" style={{ color: config.colors.textMuted }}>
              Every figurine is a masterpiece created with precision technology and artistic dedication
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {craftList.map((item: { title: string; desc: string }, i: number) => (
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

      {/* How It's Made - Timeline */}
      <section id="how-it-works" className="py-24" style={{ backgroundColor: config.colors.background }}>
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl" style={{ color: config.colors.text }}>How It's Made</h2>
            <p className="mx-auto max-w-2xl text-lg" style={{ color: config.colors.textMuted }}>
              Every figurine is meticulously handcrafted with secondary quality inspection. Estimated delivery in 2–4 weeks.
            </p>
          </div>

          {/* Mobile: Simple vertical list */}
          <div className="space-y-6 md:hidden">
            {processList.map((item: { title: string; desc: string }, i: number) => (
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

          {/* Desktop: Timeline layout */}
          <div className="hidden md:block">
            <div className="relative mx-auto max-w-4xl">
              <div className="absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2" style={{ backgroundColor: config.colors.border }} />

              <div className="space-y-8">
                {processList.map((item: { title: string; desc: string }, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="w-[45%]">
                      {i % 2 === 0 && (
                        <div className={`text-right ${styles.card} p-4 mr-4`} style={{ backgroundColor: config.colors.background }}>
                          <h3 className="mb-1 font-semibold" style={{ color: config.colors.text }}>{item.title}</h3>
                          <p className="text-sm" style={{ color: config.colors.textMuted }}>{item.desc}</p>
                        </div>
                      )}
                    </div>

                    <div className="relative z-10 flex flex-shrink-0 items-center justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white" style={{ backgroundColor: config.colors.primary }}>
                        {i + 1}
                      </div>
                    </div>

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

      {/* FAQ */}
      <section className="py-20" style={{ backgroundColor: config.colors.backgroundAlt }}>
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="mb-10 text-center text-3xl font-bold" style={{ color: config.colors.text }}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqList.map((item: { q: string; a: string }, i: number) => (
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
