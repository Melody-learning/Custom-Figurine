'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useStore } from '@/lib/store';


/* --- Mock Data --- */
interface SceneData {
  id: number;
  tag: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  image: string;
  thumb: string;
  accent: string;
}

const SCENES: SceneData[] = [
  {
    id: 0,
    tag: "Children's Doodles",
    title: 'Doodles Come Alive',
    titleZh: '涂鸦成真',
    description: "Turn your child's wildest drawings into tangible, one-of-a-kind figurines — a childhood memory you can hold.",
    descriptionZh: '将孩子们天马行空的画作，化为触手可及的童年纪念。',
    image: '/images/hero/image/tongzhen-bg.jpg',
    thumb: '/images/hero/image/tongzhen-thumb.jpg',
    accent: 'from-amber-500/20 via-orange-400/10 to-transparent',
  },
  {
    id: 1,
    tag: 'Portrait Figurines',
    title: 'Your Photo, Your Figurine',
    titleZh: '真人手办',
    description: "Upload a photo of yourself or someone special — we'll turn it into a stunning, museum-quality collectible.",
    descriptionZh: '上传一张照片，我们将它变成博物馆级别的精致收藏品。',
    image: '/images/hero/image/zhenren-bg.jpg',
    thumb: '/images/hero/image/zhenren-thumb.jpg',
    accent: 'from-pink-500/20 via-rose-400/10 to-transparent',
  },
  {
    id: 2,
    tag: 'Game Characters',
    title: 'Level-Up to Reality',
    titleZh: '游戏角色现实化',
    description: "Bring your legendary in-game avatar to your desktop — every armor detail, perfectly replicated.",
    descriptionZh: '把你在虚拟世界中的无敌神装角色，完美复现到现实桌面。',
    image: '/images/hero/image/youxi-bg.jpg',
    thumb: '/images/hero/image/youxi-thumb.jpg',
    accent: 'from-violet-500/20 via-purple-400/10 to-transparent',
  },
];

const INTERVAL_MS = 6000;

/* --- Component --- */
export default function HeroShowcase() {
  const { resetGenerationFlow } = useStore();
  const [scenes, setScenes] = useState(SCENES);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [textKey, setTextKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const autoRef = useRef<NodeJS.Timeout | null>(null);

  // Load slides from DB (fallback to hardcoded SCENES)
  useEffect(() => {
    fetch('/api/hero-slides')
      .then(res => res.json())
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const mapped: SceneData[] = data.map((s, i) => ({
            id: i,
            tag: s.tag,
            title: s.title,
            titleZh: s.titleZh || s.title,
            description: s.description,
            descriptionZh: s.descriptionZh || s.description,
            image: s.imageUrl,
            thumb: s.thumbUrl,
            accent: s.accent || 'from-amber-500/20 via-orange-400/10 to-transparent',
          }));
          setScenes(mapped);
        }
      })
      .catch(() => { /* keep fallback SCENES */ });
  }, []);

  const scene = scenes[activeIndex];

  // --- Transition logic ---
  const switchTo = useCallback((index: number) => {
    if (index === activeIndex || isTransitioning) return;
    setIsTransitioning(true);
    setProgress(0); // reset progress
    setTimeout(() => {
      setActiveIndex(index);
      setTextKey((k) => k + 1);
      setTimeout(() => setIsTransitioning(false), 80);
    }, 450);
  }, [activeIndex, isTransitioning]);

  const prev = () => switchTo((activeIndex - 1 + SCENES.length) % SCENES.length);
  const next = () => switchTo((activeIndex + 1) % SCENES.length);

  // --- Auto-rotate with progress bar ---
  useEffect(() => {
    // Progress tick every 50ms
    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + (50 / INTERVAL_MS) * 100, 100));
    }, 50);

    // Auto-advance
    autoRef.current = setInterval(() => {
      setIsTransitioning(true);
      setProgress(0);
      setTimeout(() => {
        setActiveIndex((i) => (i + 1) % SCENES.length);
        setTextKey((k) => k + 1);
        setTimeout(() => setIsTransitioning(false), 80);
      }, 450);
    }, INTERVAL_MS);

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, []);

  // Reset progress & timer when user manually switches
  useEffect(() => {
    setProgress(0);
    // Reset auto-rotation timer
    if (autoRef.current) clearInterval(autoRef.current);
    if (progressRef.current) clearInterval(progressRef.current);

    progressRef.current = setInterval(() => {
      setProgress((p) => Math.min(p + (50 / INTERVAL_MS) * 100, 100));
    }, 50);

    autoRef.current = setInterval(() => {
      setIsTransitioning(true);
      setProgress(0);
      setTimeout(() => {
        setActiveIndex((i) => (i + 1) % SCENES.length);
        setTextKey((k) => k + 1);
        setTimeout(() => setIsTransitioning(false), 80);
      }, 450);
    }, INTERVAL_MS);

    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
      if (autoRef.current) clearInterval(autoRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (carouselRef.current) {
      const thumbs = carouselRef.current.children;
      if (thumbs[activeIndex]) {
        (thumbs[activeIndex] as HTMLElement).scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest',
        });
      }
    }
  }, [activeIndex]);

  return (
    <section className="relative w-full h-[100svh] min-h-[600px] max-h-[960px] overflow-hidden bg-black select-none">

      {/* === Background Image Layer with Ken Burns === */}
      {scenes.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === activeIndex && !isTransitioning ? 1 : 0 }}
        >
          <Image
            src={s.image}
            alt={s.title}
            fill
            sizes="100vw"
            quality={90}
            priority={i === 0}
            className={`object-cover transition-transform duration-[8000ms] ease-out ${
              i === activeIndex ? 'scale-110' : 'scale-100'
            }`}
          />
        </div>
      ))}

      {/* === Cinematic Overlays === */}
      {/* Full-width left-to-right gradient — smooth fade, no hard edge */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-transparent z-10" />
      {/* Bottom gradient for thumbnail readability */}
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-black/70 via-black/25 to-transparent z-10" />
      {/* Per-scene color accent */}
      <div className={`absolute inset-0 bg-gradient-to-br ${scene.accent} z-10 transition-all duration-700`} />
      {/* Subtle film grain texture */}
      <div className="absolute inset-0 z-10 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

      {/* === Main Content — use same container as body sections for alignment === */}
      <div className="relative z-20 h-full flex flex-col justify-between pt-28 pb-6">
        <div className="container mx-auto px-4 flex-1 flex flex-col justify-between">

        {/* --- Top: Text Content with Stagger Animation --- */}
        <div className="flex-1 flex flex-col justify-center max-w-2xl" key={textKey}>
          {/* Scene Tag */}
          <span className="inline-block w-fit px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] border border-white/20 text-white/60 backdrop-blur-sm mb-6 opacity-0 animate-[heroFadeSlideUp_0.6s_0.1s_ease-out_forwards]">
            {scene.tag}
          </span>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight mb-5 opacity-0 animate-[heroFadeSlideUp_0.7s_0.2s_ease-out_forwards]">
            {scene.title}
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-white/60 leading-relaxed max-w-lg mb-10 opacity-0 animate-[heroFadeSlideUp_0.6s_0.4s_ease-out_forwards]">
            {scene.description}
          </p>

          {/* CTA Button */}
          <div className="flex items-center gap-4 opacity-0 animate-[heroFadeSlideUp_0.6s_0.55s_ease-out_forwards]">
            <Link
              href="/customize"
              onClick={() => resetGenerationFlow()}
              className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white text-black font-bold text-base shadow-2xl hover:shadow-white/25 hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
            >
              Start Customizing
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-300" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-sm font-medium transition-colors duration-300"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* --- Bottom: Thumbnail Carousel spanning full container width --- */}
        <div className="flex flex-col gap-3 mt-auto">

          {/* Thumbnail Row — flush-aligned with container edge */}
          <div
            ref={carouselRef}
            className="w-full flex gap-3 overflow-x-auto py-2"
            style={{ scrollbarWidth: 'none' }}
          >
            {scenes.map((s, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={s.id}
                  onClick={() => switchTo(i)}
                  className={`
                    relative flex-shrink-0 w-[150px] sm:w-[180px] aspect-video rounded-xl overflow-hidden cursor-pointer
                    transition-all duration-500 origin-left group
                    ${isActive
                      ? 'ring-2 ring-white/80 ring-offset-2 ring-offset-black/50 scale-100 shadow-2xl'
                      : 'opacity-40 hover:opacity-70 scale-[0.92] hover:scale-[0.96]'
                    }
                  `}
                >
                  <Image
                    src={s.thumb}
                    alt={s.tag}
                    fill
                    className={`object-cover transition-all duration-500 ${
                      isActive ? 'brightness-100' : 'brightness-75 group-hover:brightness-90'
                    }`}
                  />
                  {/* Gradient overlay with label */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
                    <span className="text-[9px] text-white/50 uppercase tracking-[0.15em] font-medium">{s.tag}</span>
                    <span className="text-sm font-bold text-white leading-tight mt-0.5">{s.title}</span>
                  </div>

                  {/* Active progress bar on the thumbnail */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10">
                      <div
                        className="h-full bg-white/80 transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Bar: ‹ prev | counter | next › ... scroll hint */}
          <div className="flex items-center justify-between w-full">
            {/* Left group: arrows + counter */}
            <div className="flex items-center gap-3">
              <button
                onClick={prev}
                aria-label="Previous scene"
                className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 hover:bg-white/5 backdrop-blur-sm transition-all duration-300 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 text-white/30">
                <span className="text-2xl font-extralight tabular-nums tracking-wider">
                  {String(activeIndex + 1).padStart(2, '0')}
                </span>
                <span className="text-[10px] font-medium tracking-widest">/ {String(SCENES.length).padStart(2, '0')}</span>
              </div>
              <button
                onClick={next}
                aria-label="Next scene"
                className="w-8 h-8 rounded-full border border-white/15 flex items-center justify-center text-white/40 hover:text-white hover:border-white/40 hover:bg-white/5 backdrop-blur-sm transition-all duration-300 cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Right group: scroll hint */}
            <div className="flex items-center gap-1.5 text-white/25 animate-bounce" style={{ animationDuration: '2s' }}>
              <span className="text-[10px] uppercase tracking-widest font-medium">Scroll</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
        </div>
      </div>

    </section>
  );
}
