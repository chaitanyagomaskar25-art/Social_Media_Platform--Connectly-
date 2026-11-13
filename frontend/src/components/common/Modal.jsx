import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
  className = '',
}) {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflowHtml = document.documentElement.style.overflow;
    const originalOverflowBody = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Compensate for scrollbar disappearing to avoid layout shift
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Freeze both html and body scrolling
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.documentElement.style.overflow = originalOverflowHtml;
      document.body.style.overflow = originalOverflowBody;
      document.body.style.paddingRight = originalPaddingRight;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-3 sm:p-6">
      {/* Clean Dimmed Backdrop without blur - non-scrollable */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 transition-opacity duration-200"
        onClick={onClose}
        onWheel={(e) => e.preventDefault()}
        onTouchMove={(e) => e.preventDefault()}
        aria-hidden="true"
      />

      {/* Modal Dialog Container - Centered in Viewport */}
      <div
        className={`relative transform overflow-hidden rounded-3xl bg-surface text-left shadow-editorial-xl transition-all my-auto w-full ${maxWidth} max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3.5rem)] flex flex-col border border-border-medium animate-dialog-enter z-10 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border-subtle px-4 sm:px-6 py-3.5 sm:py-4 shrink-0">
            <h3 className="editorial-heading text-base sm:text-xl font-medium text-txt-primary tracking-tight truncate pr-2">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full text-txt-tertiary hover:text-txt-primary hover:bg-surface-subtle transition-all duration-200 active:scale-90 focus:outline-none shrink-0"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>,
    document.body
  );
}
