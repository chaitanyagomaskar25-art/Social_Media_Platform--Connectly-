import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeToggle({
  variant = 'icon',
  size = 'md',
  className = '',
  showLabel = false,
}) {
  const { isDark, toggleTheme, resolvedTheme } = useTheme();

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-medium bg-surface hover:bg-surface-subtle text-txt-primary text-xs font-medium tracking-tight shadow-editorial-xs transition-all duration-200 active:scale-95 ${className}`}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <span className="relative flex items-center justify-center w-4 h-4">
          <Sun
            className={`w-3.5 h-3.5 text-amber-500 transition-all duration-300 ease-gentle transform ${
              isDark ? 'scale-0 -rotate-90 opacity-0 absolute' : 'scale-100 rotate-0 opacity-100'
            }`}
          />
          <Moon
            className={`w-3.5 h-3.5 text-accent transition-all duration-300 ease-gentle transform ${
              isDark ? 'scale-100 rotate-0 opacity-100' : 'scale-0 rotate-90 opacity-0 absolute'
            }`}
          />
        </span>
        <span className="capitalize">{resolvedTheme}</span>
      </button>
    );
  }

  if (variant === 'switch') {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border border-border-medium bg-surface-subtle p-0.5 transition-colors duration-300 ease-gentle focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${className}`}
        aria-label="Toggle theme mode"
      >
        <span
          className={`pointer-events-none flex h-5 w-5 transform items-center justify-center rounded-full bg-surface shadow-editorial-xs ring-1 ring-border-subtle transition-transform duration-300 ease-gentle ${
            isDark ? 'translate-x-5 text-accent' : 'translate-x-0 text-amber-500'
          }`}
        >
          {isDark ? (
            <Moon className="h-3 w-3 transition-transform duration-300 rotate-0" />
          ) : (
            <Sun className="h-3 w-3 transition-transform duration-300 rotate-0" />
          )}
        </span>
      </button>
    );
  }

  // Default 'icon' variant
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-9 h-9 rounded-xl',
    lg: 'w-10 h-10 rounded-2xl',
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative inline-flex items-center justify-center border border-border-subtle hover:border-border-medium bg-surface hover:bg-surface-subtle text-txt-secondary hover:text-txt-primary shadow-editorial-xs transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <Sun
        className={`w-4 h-4 text-amber-500 transition-all duration-300 ease-gentle transform ${
          isDark ? 'scale-0 -rotate-90 opacity-0 absolute' : 'scale-100 rotate-0 opacity-100 group-hover:rotate-45'
        }`}
      />
      <Moon
        className={`w-4 h-4 text-accent transition-all duration-300 ease-gentle transform ${
          isDark ? 'scale-100 rotate-0 opacity-100 group-hover:-rotate-12' : 'scale-0 rotate-90 opacity-0 absolute'
        }`}
      />
      {showLabel && (
        <span className="ml-2 text-xs font-medium capitalize">{resolvedTheme}</span>
      )}
    </button>
  );
}
