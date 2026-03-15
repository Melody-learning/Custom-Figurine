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

export default function CyberpunkHome() {
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
    { title: '3D Printing', desc: 'Using SLA technology, we print with layer precision of 25 microns.' },
    { title: 'Hand Painting', desc: 'Skilled artisans hand-paint with meticulous attention to detail.' },
    { title: 'Quality Check', desc: 'Rigorous multi-stage inspection to ensure highest standards.' },
    { title: 'Safe Packing', desc: 'Shock-proof packaging specifically designed for worldwide delivery.' }
  ];

  const processList = currentTranslations.processList || [
    { title: 'AI Generation', desc: 'transforms your photo into a stunning 3D render' },
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
    'Fan art & collection'
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
    <main className="min-h-screen font-mono uppercase selection:bg-[#00f0ff] selection:text-black relative" style={{ backgroundColor: config.colors.background, color: config.colors.text }}>
      
      {/* Global Scanline Overlay */}
      <div className="fixed inset-0 pointer-events-none z-50 h-[10px] bg-[#00f0ff]/10 animate-scanline mix-blend-screen" />
      <div className="fixed inset-0 pointer-events-none z-0 bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[size:100%_4px]" />

      <section 
        className="relative min-h-[90vh] flex items-center overflow-hidden border-b-2"
        style={{ borderColor: config.colors.border }}
        onMouseMove={handleHeroMove}
        onTouchMove={handleHeroMove}
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none animate-pulse-glow" />
        
        <div className="container mx-auto px-4 relative z-10 pt-20">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            
            <div className="lg:w-1/2 flex flex-col items-start gap-6 animate-reveal-up">
              <div className="flex items-center gap-2 px-3 py-1 border border-[#00f0ff] bg-[#00f0ff]/10 text-[#00f0ff] text-xs font-bold tracking-widest hover:animate-glitch cursor-default transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                <Sparkles className="w-3 h-3 animate-blink" />
                SYSTEM_V2.0_ONLINE
              </div>
              
              <h1 className="text-6xl md:text-8xl font-black leading-none tracking-tighter group cursor-default" style={{ color: config.colors.primary, textShadow: '4px 4px 0px #ff003c' }}>
                <span className="group-hover:animate-glitch inline-block">{t('heroTitle')}</span>
                <span className="animate-blink inline-block ml-2 w-4 h-12 bg-[#00f0ff] relative top-2"></span>
              </h1>
              
              <p className="text-xl md:text-2xl mt-4 max-w-xl border-l-4 pl-4 normal-case animate-fade-in" style={{ borderColor: config.colors.secondary, color: config.colors.textMuted, animationDelay: '0.4s' }}>
                {t('heroSubtitle')}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <Link href="/customize" onClick={() => resetGenerationFlow()} className="relative group overflow-hidden px-8 py-4 font-bold tracking-widest text-[#090a0f] bg-[#f3e600] flex items-center justify-center gap-2 hover:bg-[#ff003c] hover:text-white hover:border-[#ff003c] border-2 border-[#f3e600] transition-colors shadow-[0_0_15px_rgba(243,230,0,0.5)]">
                  <span className="relative z-10 flex items-center gap-2">
                    {t('startCustomizing')} <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                  </span>
                  <div className="absolute inset-0 w-full h-full bg-[#ff003c] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 pointer-events-none" />
                </Link>
                
                <Link href="#how-it-works" className="px-8 py-4 font-bold tracking-widest border-2 border-[#00f0ff] text-[#00f0ff] hover:bg-[#00f0ff] hover:text-black transition-colors flex items-center justify-center shadow-[4px_4px_0_0_#00f0ff] hover:animate-glitch">
                  INITIALIZE_SCAN
                </Link>
              </div>
            </div>

            <div className="lg:w-1/2 relative w-full aspect-[4/5] max-w-lg group">
              <div className="absolute inset-0 bg-[#00f0ff] translate-x-3 translate-y-3 opacity-50 mix-blend-screen pointer-events-none group-hover:animate-glitch" />
              <div className="absolute inset-0 bg-[#ff003c] -translate-x-3 -translate-y-3 opacity-50 mix-blend-screen pointer-events-none group-hover:animate-glitch transition-transform duration-[2s]" />
              <div className="relative h-full w-full border-2 border-[#00f0ff] bg-black p-2 shadow-[0_0_30px_rgba(0,240,255,0.4)] transition-all">
                <ImageSlider
                  beforeImage="/images/before_sketch.png"
                  afterImage="/images/after_photo.jpg"
                  className="w-full h-full object-cover filter contrast-125 saturate-150"
                  beforeLabel="DATA_INPUT"
                  afterLabel="RENDER_OUTPUT"
                  position={sliderPos}
                />
                <div className="absolute -right-6 top-10 bg-[#f3e600] text-black font-bold p-2 rotate-90 origin-right whitespace-nowrap hidden md:block border-2 border-black animate-pulse-glow">
                  CYBERNETIC_RECONSTRUCTION
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Scenarios Section */}
      <section className="py-24 border-b border-[#333] relative">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="animate-reveal-up">
              <h2 className="text-4xl font-black mb-6 text-[#00f0ff] tracking-widest drop-shadow-[2px_2px_0_#ff003c] flex items-center gap-4">
                <span className="w-12 h-1 bg-[#ff003c]" /> TARGET_SCENARIOS
              </h2>
              <p className="text-lg normal-case mb-8 border-l-2 border-[#00f0ff] pl-4 bg-[#00f0ff]/5 py-2" style={{ color: config.colors.textMuted }}>
                A custom figurine is more than just a decoration — it's a meaningful gift that captures memories and emotions.
              </p>
              <div className="space-y-4 font-bold">
                {scenariosList.map((item: string, i: number) => (
                  <div key={i} className="flex items-center gap-4 bg-[#12121c] p-4 border border-[#333] hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 transition-colors group">
                    <Check className="h-5 w-5 text-[#ff003c] group-hover:scale-125 transition-transform" />
                    <span className="group-hover:text-[#00f0ff] transition-colors">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4 translate-y-8">
                <div className="border border-[#00f0ff] p-1 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-[#00f0ff]/20 opacity-0 group-hover:opacity-100 z-10 mix-blend-screen transition-opacity" />
                  <img src={scenarioImages[0]} alt="Gifts" className="w-full h-[200px] object-cover filter grayscale hover:grayscale-0 scale-100 group-hover:scale-110 transition-all duration-500" />
                </div>
                <div className="border border-[#ff003c] p-1 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-[#ff003c]/20 opacity-0 group-hover:opacity-100 z-10 mix-blend-screen transition-opacity" />
                  <img src={scenarioImages[1]} alt="Pets" className="w-full h-[150px] object-cover filter grayscale hover:grayscale-0 scale-100 group-hover:scale-110 transition-all duration-500" />
                </div>
              </div>
              <div className="space-y-4 -translate-y-8">
                <div className="border border-[#f3e600] p-1 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-[#f3e600]/20 opacity-0 group-hover:opacity-100 z-10 mix-blend-screen transition-opacity" />
                  <img src={scenarioImages[2]} alt="Collections" className="w-full h-[150px] object-cover filter grayscale hover:grayscale-0 scale-100 group-hover:scale-110 transition-all duration-500" />
                </div>
                <div className="border border-[#00f0ff] p-1 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-[#00f0ff]/20 opacity-0 group-hover:opacity-100 z-10 mix-blend-screen transition-opacity" />
                  <img src={scenarioImages[3]} alt="Wedding" className="w-full h-[200px] object-cover filter grayscale hover:grayscale-0 scale-100 group-hover:scale-110 transition-all duration-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Craftsmanship */}
      <section className="py-24 border-b border-[#333] bg-[#090a0f] relative">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-black mb-4 text-[#f3e600] tracking-widest drop-shadow-[2px_2px_0_#ff003c] inline-block hover:animate-glitch">HARDWARE_SPECS</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 max-w-6xl mx-auto">
            {craftList.map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row gap-6 bg-[#12121c] border border-[#ff003c] shadow-[4px_4px_0_0_#ff003c] hover:-translate-y-2 hover:-translate-x-2 hover:shadow-[8px_8px_0_0_#f3e600] hover:border-[#f3e600] transition-all group overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-[#00f0ff] -translate-x-full group-hover:translate-x-0 transition-transform duration-700" />
                <div className="sm:w-2/5 flex-shrink-0 overflow-hidden border-b sm:border-b-0 sm:border-r border-[#ff003c] group-hover:border-[#f3e600] transition-colors relative">
                  <div className="absolute inset-0 bg-[#ff003c] mix-blend-multiply group-hover:opacity-0 transition-opacity z-10" />
                  <img src={craftImages[i]} alt={item.title} className="h-48 sm:h-full w-full object-cover filter contrast-125 saturate-0 group-hover:saturate-100 group-hover:scale-110 transition-all duration-500" />
                </div>
                <div className="flex flex-1 flex-col justify-center p-6 sm:p-4 normal-case">
                  <h3 className="mb-2 text-xl font-black text-[#00f0ff] uppercase tracking-wider flex items-center justify-between">
                    {item.title} <span className="text-xs text-[#333] group-hover:text-[#ff003c] transition-colors">v1.{i}</span>
                  </h3>
                  <p className="text-sm text-gray-400 font-sans tracking-normal group-hover:text-white transition-colors">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process section */}
      <section id="how-it-works" className="py-24 relative overflow-hidden border-b border-[#333]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="mb-16 md:flex justify-between items-end border-b-2 border-[#333] pb-4">
            <h2 className="text-4xl font-black text-[#00f0ff] tracking-widest drop-shadow-[2px_2px_0_#ff003c]">INITIALIZE_SEQUENCE</h2>
            <div className="text-[#333] animate-pulse font-bold tracking-widest hidden md:block">LOADING DATA BLOCKS...</div>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {processList.map((item, i) => (
              <div key={i} className="border border-[#333] p-8 relative group hover:border-[#00f0ff] hover:bg-[#00f0ff]/5 transition-all duration-300 bg-[#12121c] overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                <div className="absolute top-[-50px] right-[-20px] p-4 text-8xl font-black text-[#ff003c]/10 group-hover:text-[#ff003c]/30 group-hover:scale-110 transition-all duration-500 select-none">
                  0{i + 1}
                </div>
                <div className="absolute left-0 top-0 h-full w-[2px] bg-[#00f0ff] scale-y-0 origin-top group-hover:scale-y-100 transition-transform duration-500" />
                
                <h3 className="text-xl font-bold mb-4 text-[#f3e600] tracking-widest mt-8 relative z-10 group-hover:animate-glitch inline-block">{item.title}</h3>
                <p className="text-gray-400 font-sans normal-case tracking-normal relative z-10 group-hover:text-white">{item.desc}</p>
                
                <div className="mt-6 flex items-center gap-2 relative z-10">
                  <div className="w-8 h-[2px] bg-[#333] group-hover:bg-[#ff003c] transition-colors" />
                  <span className="text-xs text-[#333] group-hover:text-[#ff003c] tracking-widest transition-colors font-bold">STEP_READY</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-[#12121c] border-b border-[#333] relative">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-[radial-gradient(circle_at_right_center,rgba(0,240,255,0.05),transparent)] pointer-events-none" />
        <div className="container mx-auto max-w-4xl px-4 relative z-10">
          <h2 className="mb-12 flex flex-col md:flex-row items-center gap-4 text-4xl font-black text-[#f3e600] tracking-widest drop-shadow-[2px_2px_0_#ff003c]">
            DATABANKS <span className="text-[#333] text-2xl animate-blink">/ FAQ</span>
          </h2>
          <div className="space-y-4">
            {faqList.map((item, i) => (
              <div 
                key={i} 
                className={`cursor-pointer bg-[#090a0f] border transition-all duration-300 ${openFaq === i ? 'border-[#ff003c] shadow-[0_0_20px_rgba(255,0,60,0.2)]' : 'border-[#333] hover:border-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]'}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between p-6">
                  <h3 className={`font-bold tracking-wide transition-colors ${openFaq === i ? 'text-[#ff003c]' : 'text-[#e6e6e6]'}`}>{item.q}</h3>
                  <div className={`p-2 rounded transition-colors ${openFaq === i ? 'bg-[#ff003c]/20' : 'bg-[#333]'}`}>
                    {openFaq === i ? <ChevronUp className="h-5 w-5 text-[#ff003c]" /> : <ChevronDown className="h-5 w-5 text-[#00f0ff]" />}
                  </div>
                </div>
                <div 
                  className={`overflow-hidden transition-all duration-500 ${openFaq === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <div className="border-t border-[#333] px-6 pb-6 pt-4 font-sans normal-case tracking-normal bg-[#00f0ff]/5">
                    <p className="text-gray-300 border-l-2 border-[#00f0ff] pl-4">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-32 bg-[#ff003c] text-white relative overflow-hidden group">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.3)_50%,transparent_75%)] bg-[size:4px_4px]" />
        
        {/* Animated background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[200px] bg-black/10 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
        <div className="absolute top-0 right-10 w-px h-full bg-white/20 animate-pulse-glow" />
        <div className="absolute top-0 left-10 w-px h-full bg-white/20 animate-pulse-glow" />

        <div className="container mx-auto px-4 text-center relative z-10 transition-transform duration-500 group-hover:scale-105">
          <h2 className="text-5xl md:text-7xl font-black mb-4 tracking-tighter shadow-xl drop-shadow-[4px_4px_0_rgba(0,0,0,1)] uppercase">{t('ctaTitle')}</h2>
          
          <div className="inline-block relative">
             <div className="absolute inset-0 bg-white/20 animate-pulse" />
             <p className="mb-12 text-2xl font-bold bg-black text-[#00f0ff] inline-block px-6 py-3 mt-4 relative z-10 border-2 border-[#00f0ff]">{t('ctaSubtitle')}</p>
          </div>
          
          <br/>
          <Link href="/customize" onClick={() => resetGenerationFlow()} className="inline-flex items-center gap-4 px-12 py-6 bg-black text-[#00f0ff] font-bold tracking-widest text-xl border-4 border-black hover:bg-[#f3e600] border-transparent hover:text-black hover:border-black transition-all shadow-[8px_8px_0_0_rgba(0,240,255,1)] hover:shadow-[0_0_30px_rgba(243,230,0,1)]">
            EXECUTE ORDER / {t('getStarted')} 
            <ArrowRight className="w-6 h-6 animate-pulse" />
          </Link>
        </div>
      </section>
    </main>
  );
}
