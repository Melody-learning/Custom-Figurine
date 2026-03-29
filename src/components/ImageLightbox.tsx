'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn } from 'lucide-react';
import { useThemeConfig } from '@/lib/useTheme';

// ============================================================
// ImageLightbox — 全屏模态图片查看组件
// 通过 React Portal 挂载到 body，不受父容器 overflow 限制
// ============================================================

interface ImageLightboxProps {
  src: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, isOpen, onClose }: ImageLightboxProps) {
  const { config } = useThemeConfig();
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // 挂载/卸载动画控制
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      // 下一帧触发进入动画
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsVisible(true));
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsMounted(false), 200); // 等动画结束再卸载
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ESC 键关闭
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // 锁定 body 滚动
      document.body.style.overflow = 'hidden';
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, handleKeyDown]);

  if (!isMounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
      style={{
        backgroundColor: isVisible ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0)',
        transition: 'background-color 200ms ease-out',
      }}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{
          backgroundColor: config.colors.primary + '20',
          color: '#ffffff',
        }}
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      {/* 图片 */}
      <img
        src={src}
        alt={alt || 'Full size preview'}
        onClick={(e) => e.stopPropagation()}
        className="select-none"
        style={{
          maxWidth: '90vw',
          maxHeight: '85vh',
          objectFit: 'contain',
          borderRadius: '8px',
          transform: isVisible ? 'scale(1)' : 'scale(0.92)',
          opacity: isVisible ? 1 : 0,
          transition: 'transform 200ms ease-out, opacity 200ms ease-out',
        }}
      />

      {/* 可选的 Alt 文字描述 */}
      {alt && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm font-medium px-4 py-2 rounded-full"
          style={{
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: '#ffffff',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 300ms ease-out 100ms',
          }}
        >
          {alt}
        </div>
      )}
    </div>,
    document.body
  );
}

// ============================================================
// ClickableImage — 自动管理 Lightbox 的 <img> 替换组件
// 用法：<ClickableImage src="..." alt="..." className="..." />
// ============================================================

interface ClickableImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  lightboxAlt?: string; // Lightbox 中显示的 alt（可选，默认使用 alt）
}

export function ClickableImage({ lightboxAlt, className, style, ...imgProps }: ClickableImageProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className="relative group cursor-pointer inline-block"
        onClick={() => setIsOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') setIsOpen(true); }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          {...imgProps}
          className={className}
          style={style}
        />
        {/* 悬停放大图标 */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-lg flex items-center justify-center pointer-events-none">
          <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-80 transition-opacity duration-200 drop-shadow-lg" />
        </div>
      </div>

      <ImageLightbox
        src={imgProps.src as string || ''}
        alt={lightboxAlt || imgProps.alt}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
