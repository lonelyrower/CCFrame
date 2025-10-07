import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Noto Sans SC',
          'sans-serif',
        ],
        serif: [
          'var(--font-serif)',
          'Playfair Display',
          'Source Han Serif SC',
          'Noto Serif SC',
          'serif',
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in-200': 'fadeIn 200ms ease-out',
        'fade-in-300': 'fadeIn 300ms ease-out',
        'zoom-in-200': 'zoomIn 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        'overlay-in-200': 'overlayIn 200ms ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        zoomIn: {
          '0%': { transform: 'scale(0.98) translateY(4px)', opacity: '0' },
          '100%': { transform: 'scale(1) translateY(0)', opacity: '1' },
        },
        overlayIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
