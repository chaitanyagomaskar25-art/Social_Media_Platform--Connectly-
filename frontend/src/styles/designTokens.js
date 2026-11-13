/**
 * Atelier Design System Tokens
 * Centralized JS references for theme tokens, z-index levels, transitions and typography.
 */

export const tokens = {
  colors: {
    light: {
      canvas: '#FAF8F5',
      surface: '#FFFFFF',
      surfaceSubtle: '#F3F1EB',
      textPrimary: '#181816',
      textSecondary: '#6B6963',
      textTertiary: '#9C9990',
      borderSubtle: 'rgba(28, 24, 20, 0.08)',
      borderMedium: 'rgba(28, 24, 20, 0.14)',
      accent: '#C2410C',
      accentHover: '#9A3412',
      accentSubtle: '#FFEDD5',
    },
    dark: {
      canvas: '#0F1013',
      surface: '#17181D',
      surfaceSubtle: '#1E2026',
      textPrimary: '#F4F4F1',
      textSecondary: '#96948E',
      textTertiary: '#6D6C66',
      borderSubtle: 'rgba(244, 244, 241, 0.08)',
      borderMedium: 'rgba(244, 244, 241, 0.14)',
      accent: '#EA580C',
      accentHover: '#F97316',
      accentSubtle: 'rgba(234, 88, 12, 0.18)',
    },
  },
  typography: {
    fonts: {
      display: 'Newsreader, Georgia, serif',
      body: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
      mono: '"JetBrains Mono", ui-monospace, monospace',
    },
    scale: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem',    // 48px
    },
  },
  zIndex: {
    dropdown: 20,
    sticky: 30,
    masthead: 40,
    modalBackdrop: 50,
    modal: 60,
    toast: 70,
    tooltip: 80,
  },
  radius: {
    xs: '4px',
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '18px',
    '2xl': '24px',
    '3xl': '32px',
    full: '9999px',
  },
  transitions: {
    fast: '150ms cubic-bezier(0.16, 1, 0.3, 1)',
    normal: '250ms cubic-bezier(0.16, 1, 0.3, 1)',
    slow: '400ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
};

export default tokens;
