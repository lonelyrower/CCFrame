const { fontFamily } = require('tailwindcss/defaultTheme')

const withOpacityValue = (variable) => ({ opacityValue } = {}) => {
  if (opacityValue !== undefined) {
    return `hsl(var(${variable}) / ${opacityValue})`
  }
  return `hsl(var(${variable}))`
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      xs: '360px',
      sm: '480px',
      md: '768px',
      lg: '1024px',
      xl: '1440px',
      '2xl': '1680px',
    },
    extend: {
      colors: {
        border: withOpacityValue('--token-color-surface-outline'),
        input: withOpacityValue('--token-color-surface-outline'),
        ring: withOpacityValue('--token-color-brand-primary'),
        background: withOpacityValue('--token-color-surface-canvas'),
        foreground: withOpacityValue('--token-color-text-primary'),
        primary: {
          DEFAULT: withOpacityValue('--token-color-brand-primary'),
          foreground: withOpacityValue('--token-color-text-inverted'),
          strong: withOpacityValue('--token-color-brand-primary-strong'),
        },
        accent: {
          DEFAULT: withOpacityValue('--token-color-brand-accent'),
          foreground: withOpacityValue('--token-color-text-inverted'),
        },
        surface: {
          canvas: withOpacityValue('--token-color-surface-canvas'),
          panel: withOpacityValue('--token-color-surface-panel'),
          glass: withOpacityValue('--token-color-surface-glass'),
          outline: withOpacityValue('--token-color-surface-outline'),
        },
        interaction: {
          background: withOpacityValue('--token-color-interaction-background'),
          muted: withOpacityValue('--token-color-interaction-muted'),
          border: withOpacityValue('--token-color-interaction-border'),
          borderStrong: withOpacityValue('--token-color-interaction-border-strong'),
          ring: withOpacityValue('--token-color-interaction-ring'),
          focus: withOpacityValue('--token-color-interaction-focus'),
        },
        contrast: {
          surface: withOpacityValue('--token-color-contrast-surface'),
          outline: withOpacityValue('--token-color-contrast-outline'),
          text: withOpacityValue('--token-color-contrast-text'),
        },
        text: {
          primary: withOpacityValue('--token-color-text-primary'),
          secondary: withOpacityValue('--token-color-text-secondary'),
          muted: withOpacityValue('--token-color-text-muted'),
          inverted: withOpacityValue('--token-color-text-inverted'),
        },
        state: {
          success: '#34D399',
          warning: '#FBBF24',
          danger: '#F87171',
        },
      },
      fontFamily: {
        display: ['var(--token-typography-display-font-family)', ...fontFamily.sans],
        sans: ['var(--token-typography-sans-font-family)', ...fontFamily.sans],
      },
      maxWidth: {
        'layout-xs': 'var(--token-layout-container-xs)',
        'layout-sm': 'var(--token-layout-container-sm)',
        'layout-md': 'var(--token-layout-container-md)',
        'layout-lg': 'var(--token-layout-container-lg)',
        'layout-xl': 'var(--token-layout-container-xl)',
        'layout-hero': 'var(--token-layout-content-hero-max-width)',
      },
      spacing: {
        'section-x': 'var(--token-spacing-10)',
        'section-y': 'var(--token-spacing-12)',
        'gutter-xs': 'var(--token-layout-gutter-xs)',
        'gutter-sm': 'var(--token-layout-gutter-sm)',
        'gutter-md': 'var(--token-layout-gutter-md)',
        'gutter-lg': 'var(--token-layout-gutter-lg)',
        'gutter-xl': 'var(--token-layout-gutter-xl)',
        'content-rail': 'var(--token-layout-content-rail-gap)',
      },
      borderRadius: {
        lg: 'var(--token-radius-lg)',
        md: 'var(--token-radius-md)',
        sm: 'var(--token-radius-sm)',
        xl: 'var(--token-radius-xl)',
        full: 'var(--token-radius-full)',
      },
      boxShadow: {
        surface: 'var(--token-shadow-surface)',
        floating: 'var(--token-shadow-floating)',
        subtle: 'var(--token-shadow-subtle)',
        focus: 'var(--token-shadow-focus)',
      },
      backgroundImage: {
        'glow-primary': 'var(--token-gradient-glow-primary)',
        'glow-secondary': 'var(--token-gradient-glow-secondary)',
        'veil-deep': 'var(--token-gradient-veil-deep)',
      },
      transitionTimingFunction: {
        'ease-out': 'var(--token-motion-curve-ease-out)',
        'ease-soft': 'var(--token-motion-curve-ease-soft)',
      },
      transitionDuration: {
        xs: 'var(--token-motion-duration-xs)',
        sm: 'var(--token-motion-duration-sm)',
        md: 'var(--token-motion-duration-md)',
        lg: 'var(--token-motion-duration-lg)',
      },
      zIndex: {
        surface: 'var(--token-z-index-surface)',
        sticky: 'var(--token-z-index-sticky)',
        overlay: 'var(--token-z-index-overlay)',
        modal: 'var(--token-z-index-modal)',
        toast: 'var(--token-z-index-toast)',
      },
      animation: {
        'fade-in': 'fadeIn var(--token-motion-duration-md) var(--token-motion-curve-ease-soft)',
        'slide-up': 'slideUp var(--token-motion-duration-sm) var(--token-motion-curve-ease-out)',
        'scale-in': 'scaleIn var(--token-motion-duration-sm) var(--token-motion-curve-ease-out)',
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
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      aspectRatio: {
        photo: '4 / 3',
        landscape: '16 / 9',
        portrait: '3 / 4',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  darkMode: 'class',
}
