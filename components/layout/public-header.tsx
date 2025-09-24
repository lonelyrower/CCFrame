"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { Menu, Moon, Sun, X } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
  isNavigationActive,
  publicHighlightActions,
  publicPrimaryNavigation,
} from '@/lib/config/navigation'
import { cn } from '@/lib/utils'
import { Container } from './container'

export function PublicHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const handler = () => setMobileMenuOpen(false)
    window.addEventListener('hashchange', handler)
    return () => window.removeEventListener('hashchange', handler)
  }, [mobileMenuOpen])

  const highlightCta = publicHighlightActions[1] ?? publicHighlightActions[0]
  const themeIcon = mounted && resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />

  const handleToggleTheme = () => {
    const next = theme === 'dark' || resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  return (
    <div className="flex flex-col gap-2 py-2">
      <Container
        as="nav"
        size="xl"
        bleed="none"
        className="flex h-16 items-center justify-between gap-3"
      >
        <Link
          href="/"
          className="flex items-center gap-3 font-bold text-xl text-text-primary group"
          aria-label="Go to home"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-lg blur-sm opacity-20 group-hover:opacity-40 transition-opacity" />
            <div className="relative bg-gradient-to-r from-primary to-accent p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground">
                <circle cx="12" cy="12" r="9"/>
                <path d="M12 3v18"/>
                <path d="m16.24 7.76-8.48 8.48"/>
                <path d="m7.76 7.76 8.48 8.48"/>
                <path d="M3 12h18"/>
              </svg>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              CC Frame
            </span>
            <span className="text-xs text-text-secondary -mt-1 font-normal">
              个人相册
            </span>
          </div>
        </Link>

        <div className="hidden flex-1 items-center justify-center gap-4 lg:flex xl:gap-6">
          {publicPrimaryNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition',
                isNavigationActive(pathname, item)
                  ? 'bg-primary/15 text-primary shadow-soft'
                  : 'text-text-secondary hover:bg-surface-panel/70 hover:text-text-primary',
              )}
            >
              {item.icon ? <item.icon className="h-4 w-4" /> : null}
              {item.title}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Button variant="ghost" size="icon" onClick={handleToggleTheme}>
            {themeIcon}
            <span className="sr-only">Toggle theme</span>
          </Button>
          {highlightCta ? (
            <Link href={highlightCta.href}>
              <Button size="sm" className="shadow-soft">
                {highlightCta.title}
              </Button>
            </Link>
          ) : null}
          {session?.user ? (
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Admin
              </Button>
            </Link>
          ) : (
            <Link href="/admin/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <Button variant="ghost" size="icon" onClick={handleToggleTheme}>
            {themeIcon}
            <span className="sr-only">Toggle theme</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-expanded={mobileMenuOpen}
            aria-controls="public-nav-mobile"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </Container>

      {highlightCta ? (
        <Container size="xl" bleed="none" className="hidden justify-center lg:flex">
          <p className="rounded-full bg-surface-panel/70 px-4 py-2 text-xs text-text-secondary shadow-subtle">
            {highlightCta.description}
          </p>
        </Container>
      ) : null}

      {mobileMenuOpen ? (
        <Container size="xl" bleed="none" className="lg:hidden">
          <div className="space-y-3 rounded-2xl border border-surface-outline/40 bg-surface-panel/80 p-4 shadow-floating backdrop-blur">
            {publicPrimaryNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                  isNavigationActive(pathname, item)
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-canvas/80 hover:text-text-primary',
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon ? <item.icon className="h-4 w-4" /> : null}
                {item.title}
              </Link>
            ))}

            {highlightCta ? (
              <div className="rounded-xl bg-primary/10 p-3 text-sm text-primary">
                <p className="font-semibold">{highlightCta.title}</p>
                {highlightCta.description ? (
                  <p className="mt-1 text-xs text-primary/80">{highlightCta.description}</p>
                ) : null}
                <Link
                  href={highlightCta.href}
                  className="mt-3 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Explore now
                </Link>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-2 text-sm">
              {session?.user ? (
                <Link href="/admin" className="font-medium text-primary" onClick={() => setMobileMenuOpen(false)}>
                  Admin
                </Link>
              ) : (
                <Link href="/admin/login" className="font-medium text-primary" onClick={() => setMobileMenuOpen(false)}>
                  Log in
                </Link>
              )}
              <Link href="/contact" className="text-text-secondary" onClick={() => setMobileMenuOpen(false)}>
                Contact support
              </Link>
            </div>
          </div>
        </Container>
      ) : null}
    </div>
  )
}
