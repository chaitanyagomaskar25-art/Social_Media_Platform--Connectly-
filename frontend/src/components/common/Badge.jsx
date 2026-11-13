import React from 'react';

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  icon: Icon,
  ...props
}) {
  const baseStyles = 'inline-flex items-center font-medium tracking-tight select-none transition-colors';

  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 rounded-full gap-1',
    md: 'text-xs px-2.5 py-1 rounded-full gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 rounded-full gap-2',
  };

  const variantStyles = {
    // Default neutral tag
    default: 'bg-surface-subtle text-txt-secondary border border-border-subtle hover:border-border-medium',

    // Signature Burnt Orange Accent
    accent: 'bg-accent-subtle text-accent border border-accent/20 font-semibold',

    // Editorial Monochromatic Ink Pill
    editorial: 'bg-editorial-charcoal text-editorial-paper dark:bg-editorial-paper dark:text-editorial-charcoal font-semibold',

    // Status: Emerald Active
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20',

    // Status: Ochre Warning
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20',

    // Status: Rose Error
    danger: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20',

    // Monospace metadata tag
    mono: 'mono-meta bg-surface-subtle text-txt-tertiary border border-border-subtle text-[11px]',
  };

  return (
    <span
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.default} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {children}
    </span>
  );
}
