import type { Variants } from 'framer-motion'

type CubicBezier = [number, number, number, number]

const easeOutExpo: CubicBezier = [0.22, 1, 0.36, 1]
const easeOutCirc: CubicBezier = [0.33, 1, 0.68, 1]

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.36,
      ease: easeOutExpo,
    },
  },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.32, ease: easeOutCirc },
  },
}

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: easeOutCirc,
    },
  },
}

export const listItemRise: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: easeOutExpo,
    },
  },
}

export const slideInUp = createSlidePreset('y', 1)
export const slideInLeft = createSlidePreset('x', -1)
export const slideInRight = createSlidePreset('x', 1)

export interface ParallaxPresetOptions {
  distance?: number
  duration?: number
  ease?: CubicBezier
  opacity?: {
    from?: number
    to?: number
  }
}

export function createParallaxPreset({
  distance = 64,
  duration = 0.6,
  ease = easeOutExpo,
  opacity = {},
}: ParallaxPresetOptions = {}): Variants {
  return {
    hidden: {
      opacity: opacity.from ?? 0,
      y: distance,
    },
    visible: {
      opacity: opacity.to ?? 1,
      y: 0,
      transition: {
        duration,
        ease,
      },
    },
  }
}

export const parallaxSection: Variants = createParallaxPreset()

export interface StaggerPresetOptions {
  amount?: number
  delayChildren?: number
  direction?: 1 | -1
  when?: 'beforeChildren' | 'afterChildren'
}

export function createStaggerPreset({
  amount = 0.08,
  delayChildren = 0,
  direction = 1,
  when = 'beforeChildren',
}: StaggerPresetOptions = {}): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: amount,
        delayChildren,
        staggerDirection: direction,
        when,
      },
    },
  }
}

export const staggerContainer = (stagger = 0.08): Variants =>
  createStaggerPreset({ amount: stagger })

function createSlidePreset(
  axis: 'x' | 'y',
  direction: 1 | -1,
  { offset = 32, duration = 0.45, ease = easeOutExpo }: {
    offset?: number
    duration?: number
    ease?: CubicBezier
  } = {},
): Variants {
  const hidden: { opacity: number; x?: number; y?: number } = { opacity: 0 }
  const visible: {
    opacity: number
    x?: number
    y?: number
    transition: { duration: number; ease: CubicBezier }
  } = {
    opacity: 1,
    transition: { duration, ease },
  }

  if (axis === 'x') {
    hidden.x = offset * direction
    visible.x = 0
  } else {
    hidden.y = offset * direction
    visible.y = 0
  }

  return { hidden, visible }
}
