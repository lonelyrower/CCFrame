'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useDynamicTheme } from '@/components/providers/dynamic-theme-provider'

interface DynamicLogoProps {
  className?: string
  size?: number
}

export function DynamicLogo({ className = '', size = 20 }: DynamicLogoProps) {
  const { palette, isActive } = useDynamicTheme()
  const [logoColors, setLogoColors] = useState({
    primary: 'currentColor',
    accent: 'currentColor'
  })

  useEffect(() => {
    if (isActive && palette) {
      // 从调色板生成logo颜色
      setLogoColors({
        primary: `hsl(${palette.dominant})`,
        accent: `hsl(${palette.accent})`
      })
    } else {
      // 回到默认颜色（使用CSS变量）
      setLogoColors({
        primary: 'var(--token-color-brand-primary)',
        accent: 'var(--token-color-brand-accent)'
      })
    }
  }, [isActive, palette])

  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        filter: isActive ? 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' : 'none'
      }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="absolute inset-0 rounded-lg blur-sm opacity-20 group-hover:opacity-40 transition-opacity"
        animate={{
          background: `linear-gradient(to right, ${logoColors.primary}, ${logoColors.accent})`
        }}
        transition={{ duration: 0.5 }}
      />
      <motion.div
        className="relative p-2 rounded-lg"
        animate={{
          background: `linear-gradient(to right, ${logoColors.primary}, ${logoColors.accent})`
        }}
        transition={{ duration: 0.5 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.circle
            cx="12"
            cy="12"
            r="9"
            animate={{
              strokeDasharray: isActive ? '56.5, 0' : '0, 56.5'
            }}
            transition={{ duration: 1, delay: 0.2 }}
          />
          <motion.path
            d="M12 3v18"
            animate={{
              opacity: isActive ? 1 : 0.7
            }}
            transition={{ duration: 0.5 }}
          />
          <motion.path
            d="m16.24 7.76-8.48 8.48"
            animate={{
              strokeDasharray: isActive ? '12, 0' : '0, 12'
            }}
            transition={{ duration: 0.8, delay: 0.4 }}
          />
          <motion.path
            d="m7.76 7.76 8.48 8.48"
            animate={{
              strokeDasharray: isActive ? '12, 0' : '0, 12'
            }}
            transition={{ duration: 0.8, delay: 0.6 }}
          />
          <motion.path
            d="M3 12h18"
            animate={{
              opacity: isActive ? 1 : 0.7
            }}
            transition={{ duration: 0.5, delay: 0.1 }}
          />
        </svg>
      </motion.div>
    </motion.div>
  )
}