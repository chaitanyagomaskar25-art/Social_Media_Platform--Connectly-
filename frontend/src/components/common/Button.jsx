import React from 'react';
import { Loader2 } from 'lucide-react';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  iconPosition = 'left',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 ease-gentle focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none active:scale-[0.97] active:shadow-none';

  const sizeStyles = {
    xs: 'text-[11px] px-2.5 py-1 rounded-lg gap-1 font-medium tracking-tight',
    sm: 'text-xs px-3 py-1.5 rounded-xl gap-1.5 font-medium tracking-tight',
    md: 'text-sm px-4 py-2 rounded-xl gap-2 font-medium tracking-tight',
    lg: 'text-base px-5 py-2.5 rounded-2xl gap-2.5 font-semibold tracking-tight',
    icon: 'p-2 rounded-xl',
  };

  const variantStyles = {
    // Primary: Sophisticated Burnt Orange / Terracotta Accent
    primary:
      'bg-accent hover:bg-accent-hover text-white shadow-editorial-sm hover:shadow-editorial hover:-translate-y-0.5 active:translate-y-0',

    // Secondary: Pressed Cream / Quartz Surface
    secondary:
      'bg-surface-subtle hover:bg-surface-elevated text-txt-primary border border-border-subtle hover:border-border-medium hover:-translate-y-0.5 active:translate-y-0 shadow-editorial-xs',

    // Outline: Distinct High-Contrast Border & Surface
    outline:
      'border border-border-strong bg-surface hover:bg-surface-elevated text-txt-primary hover:-translate-y-0.5 active:translate-y-0 shadow-editorial-xs',

    // Ghost: Ambient Text Link / Action with Clear Readability
    ghost:
      'hover:bg-surface-elevated text-txt-primary hover:text-accent font-medium',

    // Danger: Crimson Rose
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-editorial-sm hover:shadow-editorial hover:-translate-y-0.5 active:translate-y-0',

    // Editorial Luxury: Monochromatic Letterpress Pill
    editorial:
      'bg-editorial-charcoal text-editorial-paper dark:bg-editorial-paper dark:text-editorial-charcoal shadow-editorial hover:opacity-90 hover:-translate-y-0.5 active:translate-y-0',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-105" />}
        </>
      )}
    </button>
  );
}
