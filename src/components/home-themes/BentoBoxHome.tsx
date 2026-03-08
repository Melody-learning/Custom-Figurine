'use client';

import Link from 'next/link';
import { ArrowRight, Star, ArrowUpRight, Check, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from '@/lib/useTranslation';
import { useThemeConfig } from '@/lib/useTheme';
import { translations } from '@/lib/i18n';
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

export default function BentoBoxHome() {
  const { t: translate, language } = useTranslation();
  const { config } = useThemeConfig();
  const [sliderPos, setSliderPos] = useState(50);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const t = (key: any): string => {
    const value = translate(key);
    return typeof value === 'string' ? value : key;
  };

  const currentTranslations = language === 'zh' ? translations.zh : translations.en;
  
  const craftList = currentTranslations.craftList || [
    { title: '3D Printing', desc: 'Precision SLA technology capturing micro-details.' },
    { title: 'Hand Painting', desc: 'Vibrant colors applied by expert artisans.' },
    { title: 'Quality Check', desc: 'Rigorous multi-stage inspection process.' },
    { title: 'Safe Packing', desc: 'Shock-proof custom foam packaging.' }
  ];

  const processList = currentTranslations.processList || [
    { title: 'AI Generation', desc: 'Transform photo into 3D' },
    { title: '3D Modeling', desc: 'Precise digital model' },
    { title: '3D Printing', desc: 'High-quality resin' },
    { title: 'Hand Painting', desc: 'Meticulous attention' },
    { title: 'Quality Check', desc: 'Ensure perfect quality' },
    { title: 'Shipping', desc: 'Deliver safely to you' }
  ];

  const faqList = currentTranslations.faqList || [
    { q: 'How long does it take?', a: 'Typically 2-3 weeks including production and shipping. Express options available for urgent orders.' },
    { q: 'What photo should I upload?', a: 'High-resolution, well-lit photos work best. Front-facing images with clear features produce the best results.' },
    { q: 'What sizes are available?', a: 'We offer 4 sizes: 6cm, 8cm, 10cm, and 15cm. Each size includes different level of detail.' },
    { q: 'Do you ship internationally?', a: 'Yes! We ship worldwide with full tracking. Shipping times vary by location, typically 5-14 business days.' }
  ];

  const scenariosList = currentTranslations.scenariosList || [
    'Birthday gifts',
    'Anniversaries',
    'Pet portraits',
    'Corporate events',
    'Fan collections'
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
    // Moving ~38% from the center will reach the edge boundary completely
    const scale = 1.3;
    percent = 50 + (percent - 50) * scale;
    
    percent = Math.max(0, Math.min(percent, 100));
    setSliderPos(percent);
  };

  return (
    <main className="min-h-screen bg-[#f1f3f5] font-sans p-4 md:p-8" style={{ color: config.colors.text }}>
      
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        
        {/* Row 1: Hero & Slider */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 animate-reveal-up">
          
          <div className="lg:col-span-2 bg-[#1a1b1e] rounded-[2rem] p-10 md:p-14 text-white hover:scale-[1.01] transition-transform duration-500 shadow-sm relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)] pointer-events-none" />
            <div className="flex flex-col h-full justify-between relative z-10">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-8 backdrop-blur-sm border border-white/10 group-hover:bg-white/20 transition-colors cursor-default">
                  <Sparkles className="w-4 h-4 text-[#ffca28] animate-spin-slow" />
                  Next-Gen Custom Figurines
                </div>
                <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight mb-6">
                  {t('heroTitle')}
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 font-light max-w-lg mb-8">
                  {t('heroSubtitle')}
                </p>
              </div>
              
              <Link href="/customize" className="inline-flex items-center justify-between w-full md:w-auto px-8 py-5 bg-white text-black rounded-[1.5rem] font-semibold text-lg hover:bg-gray-100 transition-all hover:pr-4 group/btn shadow-[0_4px_20px_rgba(255,255,255,0.3)]">
                <span>{t('startCustomizing')}</span>
                <div className="bg-black text-white p-2 rounded-full transform group-hover/btn:rotate-45 transition-transform duration-300 ml-4">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </Link>
            </div>
          </div>

          <div 
            className="bg-white rounded-[2rem] p-4 shadow-sm h-[400px] lg:h-auto overflow-hidden relative group"
            onMouseMove={handleHeroMove}
            onTouchMove={handleHeroMove}
          >
            <div className="absolute inset-0 border-4 border-transparent group-hover:border-black/5 rounded-[2rem] pointer-events-none transition-colors z-20" />
            <div className="w-full h-full rounded-2xl overflow-hidden relative shadow-inner">
              <ImageSlider
                beforeImage="/images/before_sketch.png"
                afterImage="/images/after_photo.jpg"
                className="w-full h-full object-cover"
                beforeLabel="2D Photo"
                afterLabel="3D Model"
                position={sliderPos}
              />
            </div>
            <div className="absolute top-8 right-8 bg-black/80 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full z-20 shadow-lg border border-white/20 animate-pulse">
              INTERACTIVE
            </div>
          </div>
        </div>

        {/* Row 2: Features Marquee & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 animate-reveal-up" style={{ animationDelay: '0.1s' }}>
          
          <div className="md:col-span-3 bg-[#e8f0fe] rounded-[2rem] overflow-hidden flex items-center hover:scale-[1.01] transition-transform shadow-sm relative group cursor-default">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#e8f0fe] to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#e8f0fe] to-transparent z-10" />
            <div className="flex whitespace-nowrap animate-marquee py-8 group-hover:[animation-play-state:paused] group-hover:text-blue-600 transition-colors">
              {Array(6).fill('Premium Quality • Hand Crafted • AI Powered • Fast Shipping • ').map((item, i) => (
                <span key={i} className="text-3xl font-bold px-4 text-gray-900">{item}</span>
              ))}
            </div>
          </div>

          <div className="bg-[#fff9db] rounded-[2rem] p-8 flex flex-col justify-center items-center text-center shadow-sm hover:scale-[1.02] hover:-rotate-2 transition-transform cursor-default group">
            <div className="flex text-[#ffca28] mb-4 group-hover:scale-110 transition-transform">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-8 h-8 fill-current drop-shadow-sm" />)}
            </div>
            <p className="font-bold text-gray-900 text-xl group-hover:text-amber-600 transition-colors">4.9/5 Rating</p>
            <p className="text-gray-600 text-sm mt-1">From 2,000+ Reviews</p>
          </div>

        </div>

        {/* Row 3: Setup & Craftsmanship */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 animate-reveal-up" style={{ animationDelay: '0.2s' }}>
          
          {craftList.map((item, i) => (
            <div key={i} className="bg-white rounded-[2rem] p-6 shadow-sm hover:scale-[1.03] hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col group cursor-pointer relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-6 filter contrast-[0.9] group-hover:contrast-125 transition-all">
                <img src={craftImages[i]} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-gray-900 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}

        </div>

        {/* Row 4: Usage Scenarios */}
        <div className="bg-white p-6 md:p-10 rounded-[2rem] shadow-sm animate-reveal-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex flex-col lg:flex-row gap-10">
            <div className="lg:w-1/3 flex flex-col justify-center">
              <span className="text-blue-500 font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2 group cursor-default">
                  <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                  Perfect For
              </span>
              <h2 className="text-4xl font-bold mb-6 text-gray-900 leading-tight">Moments<br/>Worth Keeping</h2>
              <div className="flex flex-wrap gap-2">
                {scenariosList.map((item, i) => (
                  <span key={i} className="px-4 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-black hover:text-white transition-colors cursor-pointer border border-transparent shadow-sm">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="lg:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-4">
              {scenarioImages.map((src, i) => (
                <div key={i} className="rounded-2xl overflow-hidden aspect-[3/4] hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group">
                  <img src={src} alt="Scenario" className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 5: Process & Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 animate-reveal-up" style={{ animationDelay: '0.4s' }}>
          
          <div className="lg:col-span-1 bg-[#1a1b1e] rounded-[2rem] p-10 text-white shadow-sm hover:scale-[1.02] transition-transform duration-500 relative overflow-hidden group">
            <div className="absolute right-[-20%] bottom-[-20%] w-[80%] h-[80%] bg-blue-600/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-1000" />
            <h2 className="text-4xl font-bold mb-12">{t('workflowTitle')}</h2>
            <div className="space-y-8 relative z-10">
              {processList.slice(0, 3).map((step, i) => (
                <div key={i} className="flex gap-6 group/step cursor-default text-gray-400 hover:text-white transition-colors">
                  <div className="text-4xl font-black text-[#333] group-hover/step:text-blue-500 transition-colors">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1 text-gray-200 group-hover/step:text-white transition-colors">{step.title}</h3>
                    <p className="text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/customize" className="mt-12 inline-block text-blue-400 font-bold hover:text-blue-300 relative z-10 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-blue-400 hover:after:w-0 after:transition-all after:duration-300 pb-1">
              View Full Process →
            </Link>
          </div>

          <div className="lg:col-span-2 bg-[#f8e1eb] rounded-[2rem] p-10 shadow-sm hover:scale-[1.01] transition-transform overflow-hidden relative group">
             {/* Decorative pattern */}
            <div className="absolute inset-0 opacity-10 background-pattern group-hover:opacity-20 transition-opacity" style={{ backgroundImage: 'radial-gradient(#ec4899 2px, transparent 2px)', backgroundSize: '30px 30px' }} />
            
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-10 text-gray-900 group-hover:text-pink-600 transition-colors">Frequently Asked Questions</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {faqList.map((item, i) => (
                  <div 
                    key={i} 
                    className="bg-white/80 backdrop-blur-sm rounded-[1.5rem] p-6 hover:bg-white hover:shadow-[0_8px_30px_rgba(236,72,153,0.1)] transition-all cursor-pointer group/faq"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-bold text-gray-900 font-lg group-hover/faq:text-pink-600 transition-colors">{item.q}</h3>
                      <div className="bg-pink-100 p-2 rounded-full text-pink-600 group-hover/faq:bg-pink-600 group-hover/faq:text-white transition-colors flex-shrink-0">
                         {openFaq === i ? <ChevronUp className="w-5 h-5"/> : <ChevronDown className="w-5 h-5"/>}
                      </div>
                    </div>
                    {openFaq === i && (
                      <p className="mt-4 text-gray-600 text-sm leading-relaxed border-t border-pink-100 pt-4 animate-fade-in">{item.a}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Row 6: Final CTA */}
        <div className="bg-blue-600 rounded-[2rem] p-12 md:p-24 text-center text-white shadow-[0_8px_40px_rgba(37,99,235,0.2)] hover:shadow-[0_12px_60px_rgba(37,99,235,0.4)] transition-shadow duration-700 animate-reveal-up group relative overflow-hidden" style={{ animationDelay: '0.5s' }}>
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] bg-[size:40px_40px]" />
          
          <div className="relative z-10 group-hover:scale-105 transition-transform duration-700">
            <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight drop-shadow-sm">{t('ctaTitle')}</h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-2xl mx-auto font-light bg-black/10 rounded-full inline-block px-8 py-3 backdrop-blur-sm border border-white/10">{t('ctaSubtitle')}</p>
            <br/>
            <Link href="/customize" className="inline-flex items-center gap-4 px-10 py-5 bg-white text-blue-600 rounded-full font-bold text-xl hover:bg-gray-100 transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]">
              {t('getStarted')} <ArrowRight className="w-6 h-6 animate-pulse" />
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
