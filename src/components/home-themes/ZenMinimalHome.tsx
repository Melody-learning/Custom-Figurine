'use client';

import Link from 'next/link';
import { ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { useThemeConfig } from '@/lib/useTheme';
import { translations } from '@/lib/i18n';
import { useStore } from '@/lib/store';
import { ImageSlider } from '@/components/ImageSlider';
import React, { useState, useEffect } from 'react';

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

export default function ZenMinimalHome() {
  const { t: translate, language } = useTranslation();
  const { resetGenerationFlow } = useStore();
  const { config } = useThemeConfig();
  const [sliderPos, setSliderPos] = useState(50);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const t = (key: any): string => {
    const value = translate(key);
    return typeof value === 'string' ? value : key;
  };

  const currentTranslations = language === 'zh' ? translations.zh : translations.en;
  
  const craftList = currentTranslations.craftList || [
    { title: 'Printing Structure', desc: 'SLA technology captures micro-details forming the foundation.' },
    { title: 'Color Application', desc: 'Artisans methodically apply hues to breathe life into form.' },
    { title: 'Inspection Rigor', desc: 'Multi-stage quality checks ensure absolute perfection.' },
    { title: 'Secure Transport', desc: 'Custom shock-proof packing protecting the art piece.' }
  ];

  const processList = currentTranslations.processList || [
    { title: 'I. Digital Conception', desc: 'AI transforms the photograph into a spatial layout' },
    { title: 'II. Form Generation', desc: 'A precise geometric model emerges from the render' },
    { title: 'III. Materialization', desc: 'High-grade resin solidifies the digital concept' },
    { title: 'IV. Chromatic Finish', desc: 'Vibrant layers of paint are applied by hand' },
    { title: 'V. Final Assurance', desc: 'Structural and visual checks are conducted' },
    { title: 'VI. Dispatch', desc: 'The finished piece is sent on its journey to you' }
  ];

  const faqList = currentTranslations.faqList || [
    { q: 'What is the expected timeline?', a: 'The entire process spans 2-3 weeks, encompassing production and global dispatch. Expedited services exist for urgency.' },
    { q: 'What are the image requirements?', a: 'Clarity and lighting are paramount. Frontal perspectives without dramatic shadows yield the most accurate geometries.' },
    { q: 'How do dimensions vary?', a: 'Pieces are scaled vertically: 6cm, 8cm, 10cm, or 15cm. Proportional details are maintained across all sizes.' },
    { q: 'Is international delivery provided?', a: 'Yes. We utilize global logistics partners guaranteeing safe, trackable transit generally within 5-14 business days.' }
  ];

  const scenariosList = currentTranslations.scenariosList || [
    'Commemoration of milestones',
    'Preservation of beloved pets',
    'Corporate tokens of gratitude',
    'Anniversary celebrations',
    'Personal character collections'
  ];

  const handleHeroMove = (e: React.MouseEvent | React.TouchEvent) => {
    let clientX: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }
    
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    
    const relativeX = clientX - rect.left;
    let percent = (relativeX / rect.width) * 100;
    
    // Scale the percentage around the center (50%) to make it easier to reach edges (0 and 100)
    const scale = 1.3;
    percent = 50 + (percent - 50) * scale;
    
    percent = Math.max(0, Math.min(percent, 100));
    setSliderPos(percent);
  };

  return (
    <main className="min-h-screen font-serif flex flex-col selection:bg-[#718096] selection:text-white" style={{ backgroundColor: config.colors.background, color: config.colors.text }}>
      
      {/* Zen Hero Section */}
      <section className="flex-1 flex flex-col justify-center min-h-[90vh] py-20 relative overflow-hidden">
        
        {/* Very subtle background texture */}
        <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/rice-paper.png')] opacity-[0.03] pointer-events-none mix-blend-multiply" />
        
        <div className={`container mx-auto px-6 max-w-6xl z-10 transition-all duration-[2s] ease-out ${mounted ? 'opacity-100 translate-y-0 filter-none' : 'opacity-0 translate-y-12 blur-sm'}`}>
          <div className="flex flex-col lg:flex-row justify-between items-center gap-24">
            
            <div className="lg:w-1/2 flex flex-col items-start pt-10" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
              <span className="text-sm tracking-[0.3em] font-light uppercase text-[#718096] mb-12 border-b border-[#e2e8f0] pb-3 inline-block hover:tracking-[0.4em] transition-all duration-700">
                A New Standard in 3D Artistry
              </span>
              
              <h1 className="text-5xl md:text-[5.5rem] font-light leading-[1.1] text-[#1a202c] mb-12 tracking-tight group hover:opacity-80 transition-opacity duration-1000">
                {t('heroTitle')}
              </h1>
              
              <p className="text-xl md:text-2xl text-[#a0aec0] font-light max-w-md leading-relaxed mb-16 hover:text-[#718096] transition-colors duration-700">
                {t('heroSubtitle')}
              </p>

              <Link href="/customize" onClick={() => resetGenerationFlow()} className="group flex items-center gap-6 text-lg text-[#1a202c] hover:text-[#718096] transition-colors relative overflow-hidden pb-4">
                <span className="font-medium tracking-widest uppercase text-sm">{t('startCustomizing')}</span>
                <ArrowRight className="w-5 h-5 font-light transform group-hover:translate-x-3 transition-transform duration-700" />
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#e2e8f0]"></span>
                <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#1a202c] transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 ease-out"></span>
              </Link>
            </div>

            <div className="lg:w-1/2 w-full max-w-lg relative" style={{ transform: `translateY(${scrollY * -0.05}px)` }} onMouseMove={handleHeroMove} onTouchMove={handleHeroMove}>
              <div className="w-full aspect-[4/5] overflow-hidden bg-[#fdfbf7] z-10 relative group shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)]">
                {/* Slow scale on the slider container */}
                <div className="w-full h-full transition-transform duration-[3s] group-hover:scale-105">
                  <ImageSlider
                    beforeImage="/images/before_sketch.png"
                    afterImage="/images/after_photo.jpg"
                    className="w-full h-full object-cover filter contrast-[1.1] grayscale-[30%] group-hover:grayscale-0 transition-all duration-[2s]"
                    beforeLabel="Photography"
                    afterLabel="Sculpture"
                    position={sliderPos}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Scenarios Section */}
      <section className="py-40 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            
            <div className="order-2 lg:order-1 grid grid-cols-2 gap-6 relative" style={{ transform: `translateY(${scrollY * 0.05 - 50}px)` }}>
              <div className="space-y-6 lg:-translate-y-12">
                <div className="overflow-hidden group"><img src={scenarioImages[0]} alt="Scenarios" className="w-full aspect-square object-cover filter grayscale contrast-[1.1] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[1.5s]" /></div>
                <div className="overflow-hidden group"><img src={scenarioImages[1]} alt="Scenarios" className="w-full aspect-[4/3] object-cover filter grayscale contrast-[1.1] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[1.5s]" /></div>
              </div>
              <div className="space-y-6 lg:translate-y-12">
                <div className="overflow-hidden group"><img src={scenarioImages[2]} alt="Scenarios" className="w-full aspect-[4/3] object-cover filter grayscale contrast-[1.1] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[1.5s]" /></div>
                <div className="overflow-hidden group"><img src={scenarioImages[3]} alt="Scenarios" className="w-full aspect-square object-cover filter grayscale contrast-[1.1] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[1.5s]" /></div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="text-xs tracking-[0.3em] font-light uppercase text-[#718096] mb-8 block">Moments</span>
              <h2 className="text-4xl md:text-5xl font-light text-[#1a202c] mb-10 leading-tight">Meaningful<br/>Preservation</h2>
              <p className="text-[#a0aec0] font-light leading-relaxed mb-16 text-xl lg:max-w-md">
                A custom figurine transcends decoration — it becomes a vessel for memories, encapsulating emotions in physical space.
              </p>
              
              <ul className="space-y-8">
                {scenariosList.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-8 group">
                    <span className="text-[#e2e8f0] font-light text-sm w-4 group-hover:text-[#718096] transition-colors duration-500 mt-1">0{i+1}</span>
                    <span className="text-[#4a5568] font-light text-lg group-hover:text-[#1a202c] transition-colors duration-500">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Craftsmanship Section */}
      <section className="py-40 bg-[#faf9f6] relative">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-10">
            <div>
              <span className="text-xs tracking-[0.3em] font-light uppercase text-[#718096] mb-8 block">Artisan</span>
              <h2 className="text-4xl md:text-5xl font-light text-[#1a202c]">Premium Craftsmanship</h2>
            </div>
            <p className="text-[#a0aec0] font-light max-w-md text-lg leading-relaxed">
               Melding precise technological computation with patience and the human hand.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {craftList.map((item, i) => (
              <div key={i} className="group cursor-pointer">
                <div className="w-full aspect-[4/5] overflow-hidden mb-8 relative bg-white">
                  <div className="absolute inset-0 bg-[#1a202c]/10 group-hover:bg-transparent transition-colors duration-1000 z-10 pointer-events-none" />
                  <img src={craftImages[i]} alt={item.title} className="w-full h-full object-cover filter grayscale contrast-[1.1] group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-[2s]" />
                </div>
                <div className="border-t border-[#e2e8f0] pt-6 group-hover:border-[#a0aec0] transition-colors duration-700">
                  <h3 className="text-xl font-light text-[#1a202c] mb-4">{item.title}</h3>
                  <p className="text-[#718096] font-light leading-relaxed text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Minimalist Process Section */}
      <section className="py-40">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-32" style={{ transform: `translateY(${scrollY * 0.03 - 20}px)` }}>
            <span className="text-xs tracking-[0.3em] font-light uppercase text-[#718096] mb-8 block">Process</span>
            <h2 className="text-4xl md:text-5xl font-light text-[#1a202c]">Creation Sequence</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-24 gap-x-16">
            {processList.map((step, i) => (
              <div key={i} className="flex flex-col group relative">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-[#e2e8f0]" />
                <div className="absolute top-0 left-0 w-0 h-[1px] bg-[#1a202c] group-hover:w-full transition-all duration-1000 ease-in-out" />
                
                <span className="text-[#e2e8f0] font-light text-4xl mb-8 mt-12 group-hover:text-[#a0aec0] transition-colors duration-700 block">0{i+1}</span>
                <h3 className="text-xl font-light text-[#1a202c] mb-4 group-hover:-translate-y-1 transition-transform duration-500">{step.title}</h3>
                <p className="text-[#718096] font-light leading-loose text-sm group-hover:-translate-y-1 transition-transform duration-500 delay-75">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-40 bg-[#faf9f6]">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-24">
            <span className="text-xs tracking-[0.3em] font-light uppercase text-[#718096] mb-8 block">Inquiries</span>
            <h2 className="text-4xl md:text-5xl font-light text-[#1a202c]">Essential Knowledge</h2>
          </div>

          <div className="space-y-0 border-t border-[#e2e8f0]">
            {faqList.map((item, i) => (
              <div key={i} className="border-b border-[#e2e8f0]">
                <button 
                  className="w-full flex items-center justify-between py-10 text-left group focus:outline-none"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <h3 className="text-xl font-light text-[#1a202c] group-hover:text-[#718096] transition-colors duration-500">{item.q}</h3>
                  <span className={`text-xl font-light transition-transform duration-700 ${openFaq === i ? 'rotate-45 text-[#1a202c]' : 'text-[#a0aec0] group-hover:rotate-90 group-hover:text-[#718096]'}`}>
                    +
                  </span>
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${openFaq === i ? 'max-h-96 opacity-100 pb-10' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-[#718096] font-light leading-relaxed text-lg lg:w-3/4">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-56 bg-[#1a202c] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none mix-blend-overlay" />
        
        <div className="container mx-auto px-6 max-w-4xl text-center relative z-10">
          <span className="text-xs tracking-[0.3em] font-light uppercase text-[#718096] mb-12 block">Initiate</span>
          <h2 className="text-5xl md:text-[5rem] font-light text-white mb-10 tracking-tight leading-tight hover:opacity-80 transition-opacity duration-1000">{t('ctaTitle')}</h2>
          <p className="text-[#a0aec0] font-light text-xl mb-24 max-w-2xl mx-auto">{t('ctaSubtitle')}</p>
          
          <Link href="/customize" onClick={() => resetGenerationFlow()} className="group inline-flex items-center gap-8 text-xl text-white hover:text-[#e2e8f0] transition-colors relative overflow-hidden pb-4">
            <span className="font-light tracking-widest uppercase text-sm">{t('getStarted')}</span>
            <ArrowRight className="w-6 h-6 font-light transform group-hover:translate-x-4 transition-transform duration-700" />
            <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white/30" />
            <span className="absolute bottom-0 left-0 w-full h-[1px] bg-white transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 ease-out" />
          </Link>
        </div>
      </section>

    </main>
  );
}
