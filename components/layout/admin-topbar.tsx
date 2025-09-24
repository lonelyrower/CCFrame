"use client"

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { LogOut, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { Container } from './container'

export function AdminTopbar() {
  const { data: session } = useSession()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const themeIcon = mounted && resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />
  const handleToggleTheme = () => {
    const next = theme === 'dark' || resolvedTheme === 'dark' ? 'light' : 'dark'
    setTheme(next)
  }

  return (
    <Container
      as="div"
      size="xl"
      bleed="none"
      className="flex w-full items-center justify-between gap-4 py-3"
    >
      <Link href="/admin" className="flex items-center gap-2 font-display text-base font-semibold text-text-primary">
        <span className="rounded-xl bg-primary/15 px-3 py-2 text-xs font-semibold text-primary">Admin</span>
        <span>管理中心</span>
      </Link>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleToggleTheme}>
          {themeIcon}
          <span className="sr-only">Toggle theme</span>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/" className="font-medium">
            View site
          </Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Sign out
          {session?.user?.name ? (
            <span className="hidden text-xs text-text-secondary sm:inline">{session.user.name}</span>
          ) : null}
        </Button>
      </div>
    </Container>
  )
}
