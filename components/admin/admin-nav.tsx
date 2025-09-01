'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import {
  Camera,
  Upload,
  Grid3X3,
  FolderOpen,
  Wand2,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const adminNavItems = [
  { href: '/admin', label: '控制台', icon: BarChart3 },
  { href: '/admin/upload', label: '上传', icon: Upload },
  { href: '/admin/library', label: '照片库', icon: Grid3X3 },
  { href: '/admin/albums', label: '相册', icon: FolderOpen },
  { href: '/admin/ai', label: 'AI 工作台', icon: Wand2 },
  { href: '/admin/settings', label: '设置', icon: Settings },
]

export function AdminNav() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            href="/admin" 
            className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white"
          >
            <Camera className="h-6 w-6" />
            管理后台
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {adminNavItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md',
                    pathname === item.href
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Public Gallery Link */}
            <Link href="/">
              <Button variant="ghost" size="sm">
                查看前台
              </Button>
            </Link>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {/* Logout */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut()}
              title="退出登录"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            <div className="space-y-2">
              {adminNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                      pathname === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
                <Link
                  href="/"
                  className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  查看前台
                </Link>
                
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    signOut()
                  }}
                  className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
