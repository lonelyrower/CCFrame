
export const color = {
  iris: {
    50: '#EEF1FF',
    500: '#4C54FF',
    700: '#2F34CE',
  },
  cerulean: {
    500: '#37B0E5',
  },
  amber: {
    500: '#F5B86C',
  },
  rose: {
    500: '#F07288',
  },
  emerald: {
    500: '#34D399',
  },
  saffron: {
    500: '#FBBF24',
  },
  crimson: {
    500: '#F87171',
  },
  neutral: {
    0: '#FFFFFF',
    100: '#F4F6F9',
    200: '#E6E9F0',
    600: '#4B5565',
    900: '#0F1117',
  },
} as const

export const gradient = {
  'glow-iris': 'linear-gradient(135deg, rgba(99, 102, 241, 0.32) 0%, rgba(142, 155, 255, 0.05) 100%)',
  'glow-cerulean': 'radial-gradient(60% 60% at 50% 40%, rgba(55, 176, 229, 0.25) 0%, rgba(107, 231, 255, 0) 80%)',
  'veil-deep': 'linear-gradient(180deg, rgba(15, 17, 23, 0.82) 0%, rgba(15, 17, 23, 0.68) 100%)',
} as const

export const typography = {
  'font-family': {
    display: '"Playfair Display", "Source Han Serif SC", serif',
    sans: '"Inter", "Source Han Sans SC", system-ui, sans-serif',
  },
  'font-weight': {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
  },
  'font-size': {
    'display-1': '4rem',
    'display-2': '3rem',
    headline: '2.5rem',
    title: '1.75rem',
    body: '1rem',
    caption: '0.875rem',
  },
  'line-height': {
    tight: 1.2,
    snug: 1.35,
    normal: 1.5,
    relaxed: 1.7,
  },
  'letter-spacing': {
    tighter: '-0.02em',
    normal: '0em',
    wide: '0.02em',
  },
} as const

export const spacing = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  13: '52px',
  14: '56px',
  15: '60px',
  16: '64px',
} as const

export const radius = {
  none: '0px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  full: '999px',
} as const

export const shadow = {
  soft: '0 32px 60px -24px rgba(76, 84, 255, 0.35)',
  ambient: '0 12px 30px -12px rgba(24, 28, 50, 0.45)',
  subtle: '0 4px 12px rgba(15, 17, 23, 0.18)',
  focus: '0 0 0 3px rgba(76, 84, 255, 0.35)',
} as const

export const motion = {
  duration: {
    xs: '120ms',
    sm: '160ms',
    md: '260ms',
    lg: '360ms',
  },
  curve: {
    'ease-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
    'ease-soft': 'cubic-bezier(0.33, 1, 0.68, 1)',
    linear: 'linear',
  },
} as const

export const zIndex = {
  surface: 10,
  sticky: 20,
  overlay: 40,
  modal: 60,
  toast: 80,
} as const

export const baseTokens = {
  color,
  gradient,
  typography,
  spacing,
  radius,
  shadow,
  motion,
  zIndex,
} as const

export type BaseTokens = typeof baseTokens
