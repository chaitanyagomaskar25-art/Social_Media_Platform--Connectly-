import React, { useEffect, useState } from 'react';
import { getInitials } from '../../utils/formatters';

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base font-semibold',
  xl: 'w-20 h-20 text-xl font-bold',
  '2xl': 'w-28 h-28 text-2xl font-bold',
};

// Refined, architectural color pairs (Warm Terracotta, Espresso, Charcoal, Slate, Amber Bronze, Forest Olive)
const COLOR_PAIRS = [
  'bg-accent text-white',
  'bg-editorial-charcoal text-editorial-paper',
  'bg-stone-600 text-white',
  'bg-amber-700 text-white',
  'bg-emerald-700 text-white',
  'bg-zinc-700 text-white',
  'bg-amber-800 text-white',
];

export default function UserAvatar({
  src,
  name = 'User',
  size = 'md',
  className = '',
  statusIndicator,
}) {
  const [imageError, setImageError] = useState(false);
  const sizeClass = SIZES[size] || SIZES.md;

  useEffect(() => {
    setImageError(false);
  }, [src]);

  // Stable color based on name string
  const colorIndex =
    Math.abs(
      (name || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    ) % COLOR_PAIRS.length;
  const colorClass = COLOR_PAIRS[colorIndex];

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 rounded-full ${className}`}>
      {src && !imageError ? (
        <img
          src={src}
          alt={name}
          onError={() => setImageError(true)}
          className={`${sizeClass} rounded-full object-cover ring-1 ring-border-medium shadow-editorial-xs`}
        />
      ) : (
        <div
          className={`${sizeClass} ${colorClass} rounded-full flex items-center justify-center font-semibold ring-1 ring-border-medium shadow-editorial-xs select-none`}
        >
          {getInitials(name)}
        </div>
      )}
      {statusIndicator && (
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 ring-2 ring-surface rounded-full shadow-editorial-xs"
          title="Online"
        />
      )}
    </div>
  );
}
