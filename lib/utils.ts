import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
}

export function getImageUrl(photoId: string, variant: string = 'medium', format: string = 'webp'): string {
  return `/api/image/${photoId}/${variant}?format=${format}`
}

export function getOptimizedImageUrl(
  photoId: string,
  width: number,
  format: string = 'webp'
): string {
  let variant = 'medium'
  
  if (width <= 300) variant = 'thumb'
  else if (width <= 600) variant = 'small'
  else if (width <= 1200) variant = 'medium'
  else variant = 'large'
  
  return getImageUrl(photoId, variant, format)
}

export function generateSrcSet(photoId: string, format: string = 'webp'): string {
  const variants = [
    { variant: 'small', width: 600 },
    { variant: 'medium', width: 1200 },
    { variant: 'large', width: 2400 }
  ]
  
  return variants
    .map(({ variant, width }) => `${getImageUrl(photoId, variant, format)} ${width}w`)
    .join(', ')
}

export function toBase64(str: string): string {
  if (typeof window === 'undefined') {
    // Node.js
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return Buffer.from(str).toString('base64')
  }
  return window.btoa(str)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}
