"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { adminNavigationSections, adminQuickActions } from '@/lib/admin/navigation-registry'
import { useOptionalCommandPalette } from './use-optional-command-palette'


export function AdminCommandDrawer() {
  const router = useRouter()
  const palette = useOptionalCommandPalette()

  useEffect(() => {
    if (!palette) return

    const navCommands = adminNavigationSections.flatMap((section) =>
      section.items.map((item) => ({
        id: `admin-nav-${item.id}`,
        title: item.label,
        subtitle: item.description,
        group: section.title ? `导航 · ${section.title}` : '导航',
        keywords: item.keywords,
        perform: () => router.push(item.href),
      })),
    )

    const actionCommands = adminQuickActions
      .filter((action) => action.id !== 'open-command')
      .map((action) => ({
        id: `admin-action-${action.id}`,
        title: action.label,
        subtitle: action.description,
        group: '快捷操作',
        keywords: action.shortcut,
        perform: () => {
          if (action.href) {
            router.push(action.href)
          }
        },
      }))

    const dispose = palette.registerCommands([...navCommands, ...actionCommands])

    return dispose
  }, [palette, router])

  return null
}

