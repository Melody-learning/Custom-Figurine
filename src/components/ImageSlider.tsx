'use client';

import { Sparkles } from 'lucide-react';

interface ImageSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
  beforeLabel?: string;
  afterLabel?: string;
  position?: number; // 0 to 100
}

export function ImageSlider({
  beforeImage,
  afterImage,
  className = '',
  beforeLabel = 'Original',
  afterLabel = '3D Figurine',
  position = 50
}: ImageSliderProps) {
  return (
    <div className={`relative select-none overflow-hidden rounded-xl bg-gray-100 ${className}`}>
      {/* Before Image (Background) */}
      <img
        src={beforeImage}
        alt={beforeLabel}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        draggable="false"
      />
      
      {/* Before Label */}
      <div className="absolute top-4 right-4 z-10 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-opacity">
        {beforeLabel}
      </div>

      {/* After Image (Clipped overlay) */}
      <img
        src={afterImage}
        alt={afterLabel}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{
          clipPath: `inset(0 ${100 - position}% 0 0)`
        }}
        draggable="false"
      />

      {/* After Label */}
      <div 
        className="absolute top-4 left-4 z-10 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition-opacity flex items-center gap-1"
        style={{ opacity: position > 15 ? 1 : 0 }}
      >
        <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
        {afterLabel}
      </div>

      {/* Slider / Zipper line */}
      <div
        className="absolute bottom-0 top-0 z-20 w-0.5 bg-white/40 backdrop-blur-sm pointer-events-none"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      >
        <div className="absolute inset-0 bg-white opacity-50 shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
      </div>
    </div>
  );
}
