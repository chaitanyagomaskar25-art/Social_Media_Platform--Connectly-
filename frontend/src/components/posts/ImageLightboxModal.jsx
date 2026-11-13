import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Download, Sparkles } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';

export default function ImageLightboxModal({
  isOpen,
  onClose,
  images = [],
  initialIndex = 0,
  caption = '',
  author = null,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  if (!isOpen || images.length === 0) return null;

  const currentMedia = images[currentIndex];
  const currentUrl = typeof currentMedia === 'string' ? currentMedia : currentMedia?.url;
  const isVideo = currentMedia?.type === 'video' || (typeof currentUrl === 'string' && currentUrl.match(/\.(mp4|webm|mov)$/i));

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/95 backdrop-blur-xl text-white animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview"
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between p-4 sm:p-6 z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          {author && (
            <div className="flex items-center gap-2.5">
              <UserAvatar
                src={author.avatarUrl || author.avatar || author.profilePicture}
                name={author.name || author.username}
                size="sm"
              />
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white tracking-tight">
                  {author.name || author.username}
                </p>
                <p className="text-[11px] text-white/60">@{author.username || 'user'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {images.length > 1 && (
            <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-white/10 text-white/90 border border-white/10">
              {currentIndex + 1} / {images.length}
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none"
            aria-label="Close preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Image Canvas & Navigation Arrows */}
      <div className="relative flex-1 flex items-center justify-center p-2 sm:p-8 overflow-hidden">
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 sm:left-6 z-20 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white/90 hover:text-white border border-white/10 transition-all hover:scale-105"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div className="relative max-h-full max-w-full flex items-center justify-center">
          {isVideo ? (
            <video
              src={currentUrl}
              controls
              autoPlay
              playsInline
              className="max-h-[82vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
            />
          ) : (
            <img
              src={currentUrl}
              alt={caption || 'Preview image'}
              className="max-h-[82vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-all duration-300"
            />
          )}
        </div>

        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 sm:right-6 z-20 p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white/90 hover:text-white border border-white/10 transition-all hover:scale-105"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Caption Overlay */}
      {caption && (
        <div className="p-4 sm:p-6 z-10 bg-gradient-to-t from-black/90 via-black/60 to-transparent max-w-3xl mx-auto w-full text-center">
          <p className="text-xs sm:text-sm text-white/90 font-serif leading-relaxed line-clamp-3">
            {caption}
          </p>
        </div>
      )}
    </div>,
    document.body
  );
}
