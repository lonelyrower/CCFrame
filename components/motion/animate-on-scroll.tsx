'use client'

import type { CSSProperties, ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'

import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion'
import { fadeInUp } from '@/lib/motion/presets'

interface AnimateOnScrollProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  id?: string
  variants?: Variants
  delay?: number
}

const MotionDiv = motion.div

export function AnimateOnScroll({
  children,
  className,
  style,
  id,
  variants = fadeInUp,
  delay = 0,
}: AnimateOnScrollProps) {
  const prefersReducedMotion = usePrefersReducedMotion()

  if (prefersReducedMotion) {
    return (
      <div className={className} style={style} id={id}>
        {children}
      </div>
    )
  }

  return (
    <MotionDiv
      className={className}
      style={style}
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      variants={{
        ...variants,
        visible: {
          ...(variants.visible as Record<string, unknown>),
          transition: {
            delay,
            duration: 0.36,
            ease: [0.22, 1, 0.36, 1],
            ...(variants.visible as Record<string, any>)?.transition,
          },
        },
      }}
    >
      {children}
    </MotionDiv>
  )
}
