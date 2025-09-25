"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Link2, Twitter, MessageCircle, Mail, Download, QrCode, Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ShareOption {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  action: () => void | Promise<void>
}

interface ShareMenuProps {
  isOpen: boolean
  onClose: () => void
  shareUrl?: string
  shareTitle?: string
  shareDescription?: string
  className?: string
}

export function ShareMenu({
  isOpen,
  onClose,
  shareUrl = window?.location?.href || '',
  shareTitle = 'CC Frame · 光影展厅',
  shareDescription = '分享这个美妙的摄影瞬间',
  className
}: ShareMenuProps) {
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch (error) {
      console.error('Failed to copy URL:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    }
  }

  const generateQRCode = async () => {
    setIsGeneratingQR(true)
    try {
      // Mock QR code generation - in real app, use a QR library
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Here you would typically generate and download a QR code
      console.log('QR Code generated for:', shareUrl)

      // For demo, just show a success message
      alert('二维码已生成！（这是演示版本）')
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const shareOptions: ShareOption[] = [
    {
      id: 'copy-link',
      label: copiedUrl ? '已复制链接' : '复制链接',
      icon: copiedUrl ? Check : Link2,
      color: copiedUrl ? 'text-emerald-400' : 'text-blue-400',
      action: copyToClipboard
    },
    {
      id: 'twitter',
      label: '分享到 Twitter',
      icon: Twitter,
      color: 'text-sky-400',
      action: () => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`
        window.open(twitterUrl, '_blank', 'noopener,noreferrer')
      }
    },
    {
      id: 'wechat',
      label: '微信分享',
      icon: MessageCircle,
      color: 'text-green-400',
      action: () => {
        // WeChat sharing typically requires their SDK
        // For now, just copy the link
        copyToClipboard()
        alert('链接已复制，可以粘贴到微信中分享')
      }
    },
    {
      id: 'email',
      label: '邮件分享',
      icon: Mail,
      color: 'text-amber-400',
      action: () => {
        const subject = encodeURIComponent(shareTitle)
        const body = encodeURIComponent(`${shareDescription}\n\n${shareUrl}`)
        const mailtoUrl = `mailto:?subject=${subject}&body=${body}`
        window.open(mailtoUrl)
      }
    },
    {
      id: 'qr-code',
      label: isGeneratingQR ? '生成中...' : '二维码',
      icon: QrCode,
      color: 'text-purple-400',
      action: generateQRCode
    }
  ]

  // Native Web Share API (if available)
  const hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator

  const nativeShare = async () => {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareDescription,
        url: shareUrl
      })
    } catch (error) {
      console.error('Native sharing failed:', error)
    }
  }

  if (hasNativeShare) {
    shareOptions.unshift({
      id: 'native-share',
      label: '更多分享选项',
      icon: Share2,
      color: 'text-white',
      action: nativeShare
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          className={cn(
            "absolute bottom-16 right-0 z-50",
            className
          )}
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <div className="rounded-2xl border border-white/20 bg-black/80 backdrop-blur-xl shadow-2xl overflow-hidden min-w-64">
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-white/60" />
                <h3 className="font-light text-white text-sm" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
                  分享这个瞬间
                </h3>
              </div>
            </div>

            {/* Share Options */}
            <div className="p-2">
              {shareOptions.map((option, index) => {
                const IconComponent = option.icon

                return (
                  <motion.button
                    key={option.id}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors",
                      "hover:bg-white/8 focus:bg-white/8 focus:outline-none"
                    )}
                    onClick={option.action}
                    disabled={option.id === 'qr-code' && isGeneratingQR}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <div className={cn("transition-colors", option.color)}>
                      {option.id === 'qr-code' && isGeneratingQR ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-purple-400 rounded-full" />
                      ) : (
                        <IconComponent className="h-4 w-4" />
                      )}
                    </div>
                    <span className="font-light text-white/90 flex-1" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
                      {option.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>

            {/* URL Preview */}
            <div className="px-4 py-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-light text-white/50 truncate" style={{ fontFamily: 'var(--token-typography-sans-font-family)' }}>
                    {shareUrl}
                  </p>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="复制链接"
                >
                  {copiedUrl ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}