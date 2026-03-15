'use client';

import Link from 'next/link';
import { ArrowRight, Check, ChevronDown, ChevronUp } from 'lucide-react';
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

export default function RetroPopHome() {
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
    <main className="min-h-screen overflow-hidden font-sans relative selection:bg-[#ff3366] selection:text-white" style={{ backgroundColor: config.colors.background, color: config.colors.text }}>
      
      {/* Halftone pop art background */}
      <div className="fixed inset-0 pointer-events-none z-0 group" 
        style={{
          backgroundImage: 'radial-gradient(#ff3366 20%, transparent 20%)',
          backgroundSize: '15px 15px',
          opacity: 0.1,
        }}
      />
      <div className="fixed inset-0 pointer-events-none z-0 animate-pulse-glow" 
        style={{
          backgroundImage: 'radial-gradient(#00c3ff 15%, transparent 15%)',
          backgroundSize: '40px 40px',
          opacity: 0.05,
          backgroundPosition: '10px 10px'
        }}
      />

      <div className="relative z-10">
        {/* Marquee Header */}
        <div className="bg-black text-white py-3 overflow-hidden border-y-4 border-black whitespace-nowrap shadow-[0_8px_0_0_#ff3366]">
          <div className="animate-marquee inline-block font-black text-2xl uppercase tracking-widest hover:[animation-play-state:paused] cursor-crosshair">
            {Array(10).fill('★ NEW AI 3D ENGINE ★ UPLOAD YOUR PHOTO ★ ').map((item, i) => (
              <span key={i} className="mx-4">{item}</span>
            ))}
          </div>
        </div>

        <section className="container mx-auto px-4 py-12 md:py-20 animate-reveal-up">
          <div className="bg-white border-8 border-black shadow-[16px_16px_0_0_rgba(0,0,0,1)] p-8 md:p-16 relative group hover:shadow-[32px_32px_0_0_#00c3ff] transition-shadow duration-700">
            
            {/* Pop art badge */}
            <div className="absolute -top-12 -right-12 bg-[#00c3ff] text-white p-6 rotate-12 border-4 border-black font-black text-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] group-hover:rotate-[360deg] transition-transform duration-1000 w-40 h-40 flex items-center justify-center text-center rounded-full leading-snug z-20 hover:scale-125 cursor-crosshair hover:bg-[#ffeb3b] hover:text-black">
              100%<br/>CUSTOM
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
              
              <div className="flex flex-col gap-8">
                <h1 className="text-6xl md:text-[5.5rem] font-black uppercase leading-[0.9] drop-shadow-[6px_6px_0_#ff3366] hover:drop-shadow-[10px_10px_0_#00c3ff] transition-all group-hover:scale-105 origin-left duration-500">
                  {t('heroTitle')}
                </h1>
                <div className="relative inline-block self-start group/subtitle">
                  <div className="absolute inset-0 bg-black translate-x-3 translate-y-3 group-hover/subtitle:translate-x-4 group-hover/subtitle:translate-y-4 transition-transform border-4 border-black" />
                  <p className="text-2xl font-bold bg-[#ffeb3b] border-4 border-black inline-block px-6 py-4 relative z-10 animate-wiggle">
                    {t('heroSubtitle')}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-6 mt-8">
                  <Link href="/customize" onClick={() => resetGenerationFlow()} className="px-10 py-6 text-2xl font-black uppercase text-white bg-[#ff3366] border-4 border-black hover:-translate-y-2 hover:-translate-x-2 shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:shadow-[16px_16px_0_0_rgba(0,0,0,1)] transition-all flex items-center gap-4 group/btn">
                    {t('startCustomizing')} <ArrowRight className="w-8 h-8 group-hover/btn:translate-x-4 transition-transform" />
                  </Link>
                </div>
              </div>

              <div className="border-8 border-black shadow-[16px_16px_0_0_#ff3366] group-hover:shadow-[24px_24px_0_0_#00c3ff] overflow-hidden relative cursor-ew-resize transition-all duration-700" onMouseMove={handleHeroMove} onTouchMove={handleHeroMove}>
                <ImageSlider
                  beforeImage="/images/before_sketch.png"
                  afterImage="/images/after_photo.jpg"
                  className="aspect-square w-full filter contrast-125 saturate-150"
                  beforeLabel="PHOTO!"
                  afterLabel="3D FIGURINE!"
                  position={sliderPos}
                />
              </div>
            </div>

          </div>
        </section>

        {/* Scenarios Section */}
        <section className="py-20 md:py-32 bg-[#ffeb3b] border-y-8 border-black relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00c3ff] rounded-full filter blur-[100px] opacity-50 group-hover:scale-150 transition-transform duration-[2s]" />
          <div className="container mx-auto px-4 z-10 relative">
            <h2 className="text-[4rem] md:text-8xl font-black uppercase text-center mb-20 drop-shadow-[5px_5px_0_white] hover:-translate-y-2 transition-transform cursor-default z-10 relative">
              TARGET SCENARIOS!
            </h2>
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="bg-white border-8 border-black p-10 shadow-[16px_16px_0_0_rgba(0,0,0,1)] relative z-10 group-hover:-rotate-1 transition-transform">
                <p className="text-3xl font-black mb-10 uppercase bg-black text-white p-4 inline-block -rotate-2">A custom figurine is more than just a decoration — it's a meaningful gift!</p>
                <div className="space-y-6 font-bold text-xl uppercase">
                  {scenariosList.map((item: string, i: number) => (
                    <div key={i} className="flex items-center gap-6 border-b-4 border-black pb-6 last:border-0 group/item hover:pl-4 transition-all hover:bg-[#ff3366]/5">
                      <div className="bg-[#ff3366] text-white p-2 border-4 border-black shadow-[4px_4px_0_0_black] group-hover/item:shadow-[0_0_0_0_black] group-hover/item:translate-x-1 group-hover/item:translate-y-1 transition-all">
                        <Check className="h-6 w-6 font-black" />
                      </div>
                      <span className="group-hover/item:text-[#ff3366] transition-colors">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 relative">
                <div className="absolute inset-0 bg-[#00c3ff] blur-3xl opacity-30 group-hover:animate-pulse-glow" />
                <div className="border-8 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] bg-white overflow-hidden transform -rotate-3 hover:rotate-0 hover:z-20 transition-transform duration-300 relative z-10"><img src={scenarioImages[0]} alt="Gifts" className="w-full h-56 object-cover filter contrast-150 saturate-150 hover:scale-110 transition-transform duration-700" /></div>
                <div className="border-8 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] bg-white overflow-hidden transform rotate-2 mt-12 hover:rotate-0 hover:z-20 transition-transform duration-300 relative z-10"><img src={scenarioImages[1]} alt="Pets" className="w-full h-56 object-cover filter contrast-150 saturate-150 hover:scale-110 transition-transform duration-700" /></div>
                <div className="border-8 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] bg-white overflow-hidden transform -rotate-2 hover:rotate-0 hover:z-20 transition-transform duration-300 relative z-10"><img src={scenarioImages[2]} alt="Collections" className="w-full h-56 object-cover filter contrast-150 saturate-150 hover:scale-110 transition-transform duration-700" /></div>
                <div className="border-8 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] bg-white overflow-hidden transform rotate-3 mt-12 hover:rotate-0 hover:z-20 transition-transform duration-300 relative z-10"><img src={scenarioImages[3]} alt="Wedding & Couples" className="w-full h-56 object-cover filter contrast-150 saturate-150 hover:scale-110 transition-transform duration-700" /></div>
              </div>
            </div>
          </div>
        </section>

        {/* Craftsmanship Section */}
        <section className="py-20 md:py-32 bg-[#00c3ff] border-b-8 border-black relative background-pattern group">
          <div className="container mx-auto px-4 z-10 relative">
            <h2 className="text-[4rem] md:text-8xl font-black uppercase text-center mb-20 drop-shadow-[5px_5px_0_#ff3366] text-white">
              CRAFTSMANSHIP
            </h2>
            <div className="grid md:grid-cols-2 gap-12">
              {craftList.map((item, i) => (
                <div key={i} className="bg-white border-8 border-black shadow-[16px_16px_0_0_rgba(0,0,0,1)] hover:-translate-y-4 hover:shadow-[16px_24px_0_0_#ff3366] transition-all flex flex-col sm:flex-row group/card cursor-pointer duration-300">
                  <div className="sm:w-2/5 border-b-8 sm:border-b-0 sm:border-r-8 border-black overflow-hidden bg-[#ffeb3b] relative">
                    <div className="absolute inset-0 bg-[#ff3366] mix-blend-color opacity-0 group-hover/card:opacity-50 transition-opacity z-10" />
                    <img src={craftImages[i]} alt={item.title} className="h-48 sm:h-full w-full object-cover filter grayscale contrast-200 group-hover/card:grayscale-0 group-hover/card:scale-110 transition-all duration-700 mix-blend-multiply" />
                  </div>
                  <div className="flex-1 p-8">
                    <h3 className="text-3xl font-black uppercase mb-4 group-hover/card:text-[#00c3ff] transition-colors">{item.title}</h3>
                    <p className="text-xl font-bold leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-20 md:py-32 bg-white border-b-8 border-black text-black pattern-halftone animate-reveal-up relative">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(black_2px,transparent_2px)] bg-[size:20px_20px]" />
          <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-[4rem] md:text-8xl font-black uppercase text-center mb-20 drop-shadow-[5px_5px_0_#00c3ff]">
              HOW IT WORKS
            </h2>
            <div className="grid md:grid-cols-3 gap-16">
              {[
                { title: 'BAM!', desc: processList[0]?.desc || 'Upload it!', color: '#ff3366' },
                { title: 'ZAP!', desc: processList[1]?.desc || 'AI renders it!', color: '#ffeb3b' },
                { title: 'POW!', desc: processList[2]?.desc || 'We print it!', color: '#00c3ff' }
              ].map((step, i) => (
                <div key={i} className="bg-white border-8 border-black p-10 shadow-[16px_16px_0_0_rgba(0,0,0,1)] hover:-translate-y-6 hover:shadow-[16px_24px_0_0_rgba(0,0,0,1)] transition-all duration-300 relative group cursor-pointer" style={{ transform: `rotate(${i === 1 ? '2deg' : '-2deg'})` }}>
                  <div className="absolute -top-10 -left-10 text-black border-8 border-black p-4 text-5xl font-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] rounded-full w-28 h-28 flex items-center justify-center z-20 group-hover:scale-125 transition-transform duration-500 group-hover:rotate-12" style={{ backgroundColor: step.color }}>
                    {i+1}
                  </div>
                  <h3 className="text-[3rem] font-black uppercase mb-6 mt-12 group-hover:animate-wiggle" style={{ textShadow: `3px 3px 0px ${step.color}` }}>{step.title}</h3>
                  <p className="text-2xl font-bold font-sans group-hover:text-gray-700">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 md:py-32 bg-[#ff3366] border-b-8 border-black">
          <div className="container mx-auto px-4 max-w-4xl relative z-10">
            <h2 className="text-[4rem] md:text-8xl font-black uppercase text-center mb-20 drop-shadow-[5px_5px_0_#ffeb3b] text-white">
              FAQ!
            </h2>
            <div className="space-y-8">
              {faqList.map((item, i) => (
                <div key={i} className="bg-white border-8 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] group hover:-translate-y-1 hover:shadow-[16px_16px_0_0_#00c3ff] transition-all">
                  <div className="flex items-center justify-between p-8 cursor-pointer hover:bg-[#ffeb3b] transition-colors" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <h3 className="text-2xl font-black uppercase pr-4">{item.q}</h3>
                    <div className="bg-black text-white p-2 rounded-full group-hover:scale-110 transition-transform">
                       {openFaq === i ? <ChevronUp className="h-8 w-8 font-black" /> : <ChevronDown className="h-8 w-8 font-black" />}
                    </div>
                  </div>
                  {openFaq === i && (
                    <div className="px-8 pb-8 pt-4 border-t-8 border-black bg-white animate-fade-in">
                      <p className="text-xl font-bold leading-relaxed">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-40 bg-black text-white relative overflow-hidden group">
          {/* Halftone pop art background */}
          <div className="absolute inset-0 pointer-events-none group-hover:scale-110 transition-transform duration-[2s]" 
            style={{
              backgroundImage: 'radial-gradient(#ff3366 30%, transparent 30%)',
              backgroundSize: '40px 40px',
              opacity: 0.3,
            }}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[#ffeb3b] mix-blend-overlay rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity animate-pulse-glow" />

          <div className="container mx-auto px-4 text-center relative z-10">
             <div className="relative inline-block mb-12">
               <div className="absolute inset-0 bg-[#00c3ff] translate-x-4 translate-y-4" />
                <h2 className="text-[5rem] md:text-[8rem] font-black uppercase leading-[0.9] text-white relative z-10 p-6 border-8 border-white bg-black hover:-translate-y-2 hover:-translate-x-2 transition-transform cursor-crosshair">
                  {t('ctaTitle')}
                </h2>
             </div>
            
            <p className="mb-16 text-3xl md:text-4xl font-black uppercase p-6 bg-[#ffeb3b] text-black border-8 border-white inline-block transform -rotate-2 shadow-[12px_12px_0_0_#ff3366] group-hover:rotate-2 transition-transform duration-500">
              {t('ctaSubtitle')}
            </p>
            
            <div className="mt-8">
              <Link href="/customize" onClick={() => resetGenerationFlow()} className="px-16 py-8 text-4xl font-black uppercase text-black bg-[#ff3366] border-8 border-white hover:bg-[#00c3ff] hover:scale-110 shadow-[16px_16px_0_0_white] hover:shadow-[0_0_0_0_white] hover:translate-x-4 hover:translate-y-4 transition-all inline-flex items-center gap-6 group/btn">
                {t('getStarted')} <ArrowRight className="w-12 h-12 group-hover/btn:translate-x-4 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      </div>

    </main>
  );
}
