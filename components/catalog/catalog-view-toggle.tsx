"use client"

import { useTransition } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { LayoutGrid, List, Rows } from 'lucide-react'

import { Button } from '@/components/ui/button'

const VIEW_OPTIONS = [
  { value: 'masonry', label: '瀑布流', icon: Rows },
  { value: 'grid', label: '紧凑网格', icon: LayoutGrid },
  { value: 'list', label: '列表', icon: List },
] as const

export interface CatalogViewToggleProps {
  value: 'masonry' | 'grid' | 'list'
}

export function CatalogViewToggle({ value }: CatalogViewToggleProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const applyView = (nextView: CatalogViewToggleProps['value']) => {
    if (nextView === value) return

    const params = new URLSearchParams(searchParams ? searchParams.toString() : '')

    if (nextView === 'masonry') params.delete('view')
    else params.set('view', nextView)

    startTransition(() => {
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    })
  }

  return (
    <div role="group" aria-label="切换作品视图" className="flex items-center gap-2">
      {VIEW_OPTIONS.map((option) => {
        const Icon = option.icon
        const isActive = value === option.value
        return (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={isActive ? 'secondary' : 'ghost'}
            weight={isActive ? 'bold' : 'regular'}
            aria-pressed={isActive}
            onClick={() => applyView(option.value)}
            className="gap-2"
          >
            <Icon className="h-4 w-4" aria-hidden />
            {option.label}
          </Button>
        )
      })}
    </div>
  )
}
