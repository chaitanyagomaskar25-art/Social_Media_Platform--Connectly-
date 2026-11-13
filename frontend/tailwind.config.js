/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic Application Tokens
        canvas: 'var(--bg-canvas)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          subtle: 'var(--bg-surface-subtle)',
          elevated: 'var(--bg-surface-elevated)',
        },
        txt: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          muted: 'var(--text-muted)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          medium: 'var(--border-medium)',
          strong: 'var(--border-strong)',
        },

        // Distinctive Accent: Sophisticated Burnt Orange / Terracotta
        accent: {
          DEFAULT: 'var(--accent-primary)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
          text: 'var(--accent-text)',
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },

        // Backward-compatible Brand scale aliased to luxury warm terracotta
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },

        // Raw Editorial Swatches
        editorial: {
          charcoal: '#181816',
          ink: '#111110',
          paper: '#FAF8F5',
          cream: '#F3F1EB',
          ivory: '#FBFBF9',
          graphite: '#6B6963',
          smoke: '#9C9990',
          terracotta: '#C2410C',
          ember: '#EA580C',
          sand: '#E7E4DC',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        display: ['Newsreader', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'editorial-xs': '0 1px 2px 0 rgba(24, 20, 16, 0.03)',
        'editorial-sm': '0 2px 6px -1px rgba(24, 20, 16, 0.05), 0 1px 3px 0 rgba(24, 20, 16, 0.03)',
        'editorial': '0 4px 16px -2px rgba(24, 20, 16, 0.06), 0 2px 6px -1px rgba(24, 20, 16, 0.03)',
        'editorial-md': '0 8px 24px -4px rgba(24, 20, 16, 0.07), 0 3px 8px -2px rgba(24, 20, 16, 0.03)',
        'editorial-lg': '0 16px 40px -6px rgba(24, 20, 16, 0.09), 0 6px 16px -3px rgba(24, 20, 16, 0.04)',
        'editorial-glow': '0 0 24px -2px rgba(194, 65, 12, 0.22)',
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '10px',
        'lg': '14px',
        'xl': '18px',
        '2xl': '24px',
        '3xl': '32px',
      },
      transitionTimingFunction: {
        gentle: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}
