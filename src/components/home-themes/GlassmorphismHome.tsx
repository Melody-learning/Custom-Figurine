'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { useThemeConfig } from '@/lib/useTheme';
import { translations } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { ImageSlider } from '@/components/ImageSlider';
import React, { useState } from 'react';

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

export default function GlassmorphismHome() {
  const { t: translate, language } = useTranslation();
  const { resetGenerationFlow } = useStore();
  const { config } = useThemeConfig();
  const [sliderPos, setSliderPos] = useState(50);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const t = (key: any): string => {
    const value = translate(key);
    return typeof value === 'string' ? value : key;
  };

  const currentTranslations = language === 'zh' ? translations.zh : translations.en;
  
  const craftList = currentTranslations.craftList || [
    { title: '3D Printing', desc: 'SLA precision at 25 microns for flawless surface quality.' },
    { title: 'Hand Painting', desc: 'Museum-grade painting bringing characters to life.' },
    { title: 'Quality Check', desc: 'Exacting standards applied at every single stage.' },
    { title: 'Safe Packing', desc: 'Premium foam-fitted boxes preventing any in-transit damage.' }
  ];

  const processList = currentTranslations.processList || [
    { title: 'AI Generation', desc: 'Transform your image into structural outlines seamlessly.' },
    { title: '3D Modeling', desc: 'Reconstructing geometry with absolute accuracy.' },
    { title: '3D Printing', desc: 'Solidifying concepts into tangible resin sculptures.' },
    { title: 'Hand Painting', desc: 'Applying rich colors to match your memory exactly.' },
    { title: 'Quality Check', desc: 'Ensuring structural integrity and paint fidelity.' },
    { title: 'Delivery', desc: 'Securely dispatched to your destination worldwide.' }
  ];

  const faqList = currentTranslations.faqList || [
    { q: 'How long does production take?', a: 'Typically 14-21 days including all quality assurance protocols. Priority processing is available.' },
    { q: 'What kind of photos work best?', a: 'Clear, well-lit portraits or character sheets with high contrast boundaries yield the sharpest models.' },
    { q: 'Are there size variations?', a: 'Choose from 6cm, 8cm, 10cm, or 15cm heights. Detail resolution scales gracefully across all dimensions.' },
    { q: 'Can you ship internationally?', a: 'Yes. We utilize premium couriers to guarantee safe, trackable delivery anywhere on the globe in 5-14 days.' }
  ];

  const scenariosList = currentTranslations.scenariosList || [
    'Unforgettable birthday surprises',
    'Timeless anniversary keepsakes',
    'Cherished pet memorials',
    'Exclusive corporate awards',
    'Bespoke fan collections'
  ];

  const handleHeroMove = (e: React.MouseEvent | React.TouchEvent) => {
    let clientX: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }
    
    // Find the container element to calculate relative position
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    
    // Calculate position relative to container, adding a little multiplier to make it easier to reach edges Without going all the way
    const relativeX = clientX - rect.left;
    let percent = (relativeX / rect.width) * 100;
    
    // Scale the percentage around the center (50%) to make it easier to reach 0 and 100
    // If scaled by 1.2, you only need to move 83% of the way to reach the edge.
    const scale = 1.3;
    percent = 50 + (percent - 50) * scale;
    
    // Clamp between 0 and 100
    percent = Math.max(0, Math.min(percent, 100));
    
    setSliderPos(percent);
  };

  return (
    <main className="min-h-screen font-sans relative overflow-hidden bg-[#fafafa]" style={{ color: config.colors.text }}>
      
      {/* Dynamic Animated Background */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-br from-[#eff6ff] to-[#f8fafc]" />
      <div className="fixed top-[0%] left-[-10%] w-[50vw] h-[50vw] rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-pulse-glow" style={{ backgroundColor: config.colors.primary, animationDuration: '6s' }} />
      <div className="fixed bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full mix-blend-multiply filter blur-[120px] opacity-60 animate-float" style={{ backgroundColor: config.colors.secondary, animationDuration: '10s' }} />
      <div className="fixed top-[40%] left-[30%] w-[30vw] h-[30vw] rounded-full mix-blend-overlay filter blur-[100px] opacity-50 animate-pulse-glow" style={{ backgroundColor: '#e2e8f0', animationDuration: '4s' }} />

      {/* Global Frosted Glass Texture Overlay */}
      <div className="fixed inset-0 bg-white/30 backdrop-blur-[4px] pointer-events-none -z-10" />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col justify-center border-b border-white/20 pb-20 pt-32" onMouseMove={handleHeroMove} onTouchMove={handleHeroMove}>
        <div className="container mx-auto px-4 z-10 animate-reveal-up">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            <div className="lg:w-1/2 flex flex-col items-start gap-8">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] text-sm font-medium animate-float" style={{ color: config.colors.primary }}>
                <Sparkles className="w-4 h-4 animate-spin-slow text-blue-500" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">The Future of Custom Art</span>
              </div>
              
              <h1 className="text-6xl md:text-[5.5rem] font-bold leading-[1.1] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-500 block relative">
                {t('heroTitle')}
                <div className="absolute -z-10 bg-white/50 blur-[40px] w-full h-full inset-0 rounded-full" />
              </h1>
              
              <p className="text-xl md:text-2xl font-light leading-relaxed text-gray-700 animate-fade-in relative z-10" style={{ animationDelay: '0.4s' }}>
                {t('heroSubtitle')}
              </p>

              <div className="flex flex-col sm:flex-row gap-6 mt-4 w-full sm:w-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <Link href="/customize" onClick={() => resetGenerationFlow()} className="relative group overflow-hidden px-10 py-5 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.2)] hover:-translate-y-1 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto text-lg font-semibold text-gray-900 before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent before:-translate-x-[200%] hover:before:animate-[shimmer_1.5s_infinite]">
                  <span className="relative z-10 flex items-center gap-3">
                    {t('startCustomizing')} <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
                <Link href="#process" className="px-10 py-5 rounded-3xl bg-white/20 backdrop-blur-md border border-white/40 hover:bg-white/40 hover:shadow-lg transition-all flex items-center justify-center w-full sm:w-auto text-lg font-medium text-gray-700 hover:-translate-y-1">
                  How it works
                </Link>
              </div>
            </div>

            <div className="lg:w-1/2 w-full max-w-xl animate-float" style={{ animationDelay: '0.2s', animationDuration: '7s' }}>
              <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-white/20 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] p-4 group perspective-[1000px]">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                <div className="w-full h-full rounded-[2.5rem] overflow-hidden relative shadow-inner group-hover:rotate-y-[2deg] group-hover:rotate-x-[2deg] transition-transform duration-700">
                  <ImageSlider
                    beforeImage="/images/before_sketch.png"
                    afterImage="/images/after_photo.jpg"
                    className="w-full h-full object-cover filter saturate-110"
                    beforeLabel="Photo"
                    afterLabel="Figurine"
                    position={sliderPos}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Scenarios Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center bg-white/30 backdrop-blur-2xl border border-white/60 p-8 md:p-16 rounded-[3.5rem] shadow-[0_8px_40px_rgba(31,38,135,0.06)] relative overflow-hidden group">
            {/* Soft decorative glow */}
            <div className="absolute top-1/2 left-0 w-[50%] h-full -translate-y-1/2 bg-gradient-to-r from-white/40 to-transparent opacity-50 blur-[50px] pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 leading-tight">Moments worth keeping</h2>
              <p className="text-xl text-gray-600 mb-10 font-light leading-relaxed">
                A custom figurine is more than just a decoration — it's a meaningful gift that captures memories and emotions permanently.
              </p>
              <div className="space-y-4">
                {scenariosList.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-5 bg-white/50 backdrop-blur-md p-5 rounded-2xl border border-white/50 shadow-sm hover:shadow-md hover:translate-x-2 transition-all duration-300">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-2.5 rounded-xl border border-white shadow-sm text-blue-600">
                      <Check className="h-5 w-5" />
                    </div>
                    <span className="text-gray-800 font-medium text-lg">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 relative group z-10">
              <div className="absolute inset-0 bg-white/10 mix-blend-overlay rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-20 pointer-events-none blur-3xl pointer-events-none" />
              <div className="space-y-6 lg:translate-y-12">
                <div className="rounded-[2.5rem] overflow-hidden border border-white/70 shadow-lg group-hover:shadow-2xl transition-all duration-700 bg-white/20 p-2">
                  <img src={scenarioImages[0]} alt="Gifts" className="rounded-[2rem] w-full h-48 object-cover hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="rounded-[2.5rem] overflow-hidden border border-white/70 shadow-lg group-hover:shadow-2xl transition-all duration-700 bg-white/20 p-2">
                  <img src={scenarioImages[1]} alt="Pets" className="rounded-[2rem] w-full h-40 object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              </div>
              <div className="space-y-6 lg:-translate-y-4">
                <div className="rounded-[2.5rem] overflow-hidden border border-white/70 shadow-lg group-hover:shadow-2xl transition-all duration-700 bg-white/20 p-2">
                  <img src={scenarioImages[2]} alt="Collections" className="rounded-[2rem] w-full h-40 object-cover hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="rounded-[2.5rem] overflow-hidden border border-white/70 shadow-lg group-hover:shadow-2xl transition-all duration-700 bg-white/20 p-2">
                  <img src={scenarioImages[3]} alt="Wedding" className="rounded-[2rem] w-full h-56 object-cover hover:scale-105 transition-transform duration-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Craftsmanship Section */}
      <section className="py-24 relative overflow-hidden bg-white/10">
        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight">Premium Craftsmanship</h2>
            <p className="text-xl text-gray-600 font-light leading-relaxed">Combining cutting-edge computational fluid technology with traditional artisan skill to deliver perfection.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {craftList.map((item, i) => (
              <div key={i} className="bg-white/30 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.04)] hover:bg-white/50 hover:-translate-y-3 hover:shadow-[0_20px_50px_0_rgba(31,38,135,0.1)] transition-all duration-500 group overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-white/40 to-transparent blur-2xl rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="aspect-[4/3] rounded-[2rem] overflow-hidden mb-6 relative border border-white/40 bg-white/20 p-1">
                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity z-10 duration-500 mix-blend-overlay" />
                  <img src={craftImages[i]} alt={item.title} className="w-full h-full rounded-[1.8rem] object-cover group-hover:scale-110 transition-transform duration-[1.5s]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-24 relative">
        <div className="container mx-auto px-4 max-w-7xl z-10 relative">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-center mb-20 text-gray-900">The Journey</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {processList.map((step, i) => (
              <div key={i} className="relative group perspective-[1000px]">
                <div className="bg-white/40 backdrop-blur-xl border border-white/60 p-10 rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] group-hover:bg-white/70 group-hover:border-white transition-all duration-500 h-full preserve-3d group-hover:rotate-x-[2deg] group-hover:rotate-y-[-2deg] hover:-translate-y-2">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-white/80 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none blur-sm" />
                  <div className="relative z-10">
                    <div className="text-7xl font-black text-white/60 mb-8 drop-shadow-sm group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-indigo-500 transition-colors duration-500 block">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-900 border-b border-transparent group-hover:border-blue-200 pb-4 transition-colors">{step.title}</h3>
                    <p className="text-gray-600 font-light leading-relaxed text-lg">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4 max-w-4xl z-10 relative">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-900 tracking-tight">Common Questions</h2>
          <div className="space-y-6">
            {faqList.map((item, i) => (
              <div 
                key={i} 
                className={`bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2rem] overflow-hidden transition-all duration-500 hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.08)] hover:bg-white/70 hover:-translate-y-1 ${openFaq === i ? 'shadow-[0_12px_40px_0_rgba(31,38,135,0.08)] bg-white/60' : 'shadow-sm'}`}
              >
                <div 
                  className="flex items-center justify-between p-8 cursor-pointer"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <h3 className="font-semibold text-gray-900 text-xl">{item.q}</h3>
                  <div className={`p-3 rounded-2xl transition-all duration-300 ${openFaq === i ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 shadow-inner' : 'bg-white/50 border border-white/60 text-gray-500'}`}>
                    {openFaq === i ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                  </div>
                </div>
                <div 
                  className={`duration-500 ease-in-out px-8 ${openFaq === i ? 'max-h-96 opacity-100 pb-8' : 'max-h-0 opacity-0 pb-0 overflow-hidden'}`}
                >
                  <p className="text-gray-600 font-light text-lg leading-relaxed border-t border-white/50 pt-6">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern CTA */}
      <section className="py-32 relative">
        <div className="container mx-auto px-4 text-center z-10 relative">
          <div className="max-w-5xl mx-auto bg-white/40 backdrop-blur-2xl border border-white/70 p-12 md:p-24 rounded-[4rem] shadow-[0_20px_60px_rgba(31,38,135,0.08)] relative overflow-hidden group hover:shadow-[0_30px_80px_rgba(31,38,135,0.12)] transition-shadow duration-700">
            {/* Glossy reflection effect */}
            <div className="absolute top-0 left-0 w-full h-[60%] bg-gradient-to-b from-white/70 to-transparent mix-blend-overlay -translate-y-20 group-hover:translate-y-0 transition-transform duration-[1.5s] opacity-70 rounded-b-[50%]" />
            <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 -z-0" />
            
            <h2 className="text-5xl md:text-7xl font-bold mb-8 text-gray-900 tracking-tight leading-tight relative z-10 group-hover:scale-105 transition-transform duration-700">
              {t('ctaTitle')}
            </h2>
            <p className="mb-14 text-2xl font-light text-gray-700 max-w-2xl mx-auto relative z-10 bg-white/20 py-2 px-6 rounded-full inline-block backdrop-blur-sm border border-white/40">
              {t('ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 relative z-10">
              <Link href="/customize" onClick={() => resetGenerationFlow()} className="relative overflow-hidden px-14 py-6 rounded-full bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-xl hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-4 text-xl font-semibold before:absolute before:inset-0 before:bg-white/20 before:-translate-x-[200%] hover:before:animate-[shimmer_1.5s_infinite]">
                <span className="relative z-10 flex items-center gap-3">
                  {t('getStarted')} <ArrowRight className="w-6 h-6 animate-pulse" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
