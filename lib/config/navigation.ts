import type { LucideIcon } from 'lucide-react'
import {
  Aperture,
  BarChart3,
  Calendar,
  Camera,
  FolderOpen,
  Grid3X3,
  LogOut,
  Settings,
  Sparkles,
  Tag,
  Upload,
} from 'lucide-react'

export interface NavigationItem {
  title: string
  href: string
  icon?: LucideIcon
  description?: string
  badge?: string
  external?: boolean
}

export interface NavigationSection {
  title?: string
  items: NavigationItem[]
}

export const publicPrimaryNavigation: NavigationItem[] = [
  { title: 'Home', href: '/', icon: Camera },
  { title: 'Gallery', href: '/photos', icon: Grid3X3 },
  { title: 'Timeline', href: '/timeline', icon: Calendar },
  { title: 'Tags', href: '/tags', icon: Tag },
]

export const publicHighlightActions: NavigationItem[] = [
  {
    title: 'Services',
    href: '/services',
    description: 'Discover shooting packages, workflows, and success stories.',
    icon: Sparkles,
  },
  {
    title: 'Book a session',
    href: '/contact',
    description: 'Submit your brief and get a tailored recommendation.',
    icon: Aperture,
  },
]

export const adminPrimaryNavigation: NavigationItem[] = [
  { title: 'Overview', href: '/admin', icon: BarChart3 },
  { title: 'Upload', href: '/admin/upload', icon: Upload },
  { title: 'Library', href: '/admin/library', icon: Grid3X3 },
  { title: 'Albums', href: '/admin/albums', icon: FolderOpen },
  { title: 'Tags & organise', href: '/admin/organize/manage-tags', icon: Tag },
  { title: 'Settings', href: '/admin/settings', icon: Settings },
]

export const adminSecondaryNavigation: NavigationSection[] = [
  {
    title: 'Configuration & Ops',
    items: [
      { title: 'Runtime config', href: '/admin/runtime-config', icon: Settings },
      { title: 'API & integrations', href: '/admin/api-settings', icon: Sparkles },
    ],
  },
]

export const accountActions: NavigationItem[] = [
  { title: 'View site', href: '/', icon: Camera },
  { title: 'Sign out', href: '/api/auth/signout', icon: LogOut },
]

export function isNavigationActive(currentPath: string, item: NavigationItem): boolean {
  if (!item.href) return false
  if (item.href === '/') {
    return currentPath === item.href
  }
  return currentPath === item.href || currentPath.startsWith(`${item.href}/`)
}
