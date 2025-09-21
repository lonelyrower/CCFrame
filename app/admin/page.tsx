import Image from 'next/image'
import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import {
  Camera,
  Eye,
  EyeOff,
  FolderOpen,
  HardDrive,
  TrendingUp,
  Upload,
} from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { Container } from '@/components/layout/container'
import { Surface } from '@/components/ui/surface'
import { Heading, Text } from '@/components/ui/typography'
import { AnimateOnScroll } from '@/components/motion/animate-on-scroll'

interface Stats {
  totalPhotos: number
  totalAlbums: number
  publicPhotos: number
  privatePhotos: number
  recentUploads: number
  storageUsed: number
}

async function getStats(): Promise<Stats> {
  const [totalPhotos, totalAlbums, publicPhotos, privatePhotos, recentUploads] = await Promise.all([
    db.photo.count({ where: { status: 'COMPLETED' } }),
    db.album.count(),
    db.photo.count({ where: { visibility: 'PUBLIC', status: 'COMPLETED' } }),
    db.photo.count({ where: { visibility: 'PRIVATE', status: 'COMPLETED' } }),
    db.photo.count({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ])

  const variants = await db.photoVariant.aggregate({
    _sum: {
      sizeBytes: true,
    },
  })

  return {
    totalPhotos,
    totalAlbums,
    publicPhotos,
    privatePhotos,
    recentUploads,
    storageUsed: variants._sum.sizeBytes || 0,
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

async function RecentPhotos() {
  const recentPhotos = await db.photo.findMany({
    where: { status: 'COMPLETED' },
    include: {
      album: true,
      variants: {
        where: { variant: 'thumb', format: 'webp' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 6,
  })

  if (recentPhotos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <Text tone="secondary">No recent uploads yet.</Text>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {recentPhotos.map((photo) => (
        <div key={photo.id} className="group relative cursor-pointer">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-surface-outline/20">
            {photo.variants[0] && (
              <Image
                src={`/api/image/${photo.id}/thumb?format=webp`}
                alt={photo.album?.title || 'Recent photo thumbnail'}
                fill
                sizes="(min-width: 1024px) 18vw, (min-width: 768px) 30vw, 45vw"
                className="object-cover transition-transform duration-200 group-hover:scale-105"
              />
            )}
          </div>
          <a
            href={`/api/image/${photo.id}/large?format=jpeg`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 transition-colors group-hover:bg-black/25"
          >
            <div className="opacity-0 transition-opacity group-hover:opacity-100">
              {photo.visibility === 'PUBLIC' ? (
                <Eye className="h-6 w-6 text-white" />
              ) : (
                <EyeOff className="h-6 w-6 text-white" />
              )}
            </div>
          </a>
        </div>
      ))}
    </div>
  )
}

function StatsCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      label: 'Total photos',
      value: stats.totalPhotos,
      icon: Camera,
      tone: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Albums',
      value: stats.totalAlbums,
      icon: FolderOpen,
      tone: 'text-blue-500 dark:text-blue-300',
      bg: 'bg-blue-100/15 dark:bg-blue-500/10',
    },
    {
      label: 'Uploads (7d)',
      value: stats.recentUploads,
      icon: Upload,
      tone: 'text-emerald-500 dark:text-emerald-300',
      bg: 'bg-emerald-100/15 dark:bg-emerald-500/10',
    },
    {
      label: 'Storage used',
      value: formatBytes(stats.storageUsed),
      icon: HardDrive,
      tone: 'text-orange-500 dark:text-orange-300',
      bg: 'bg-orange-100/15 dark:bg-orange-500/10',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <AnimateOnScroll key={card.label} delay={index * 0.05}>
            <Surface tone="panel" padding="lg" className="shadow-subtle">
              <div className="flex items-center justify-between">
                <div>
                  <Text tone="secondary" size="sm" className="font-medium">
                    {card.label}
                  </Text>
                  <Heading size="md" className="mt-2">
                    {card.value}
                  </Heading>
                </div>
                <span className={`rounded-full p-3 ${card.bg}`}>
                  <Icon className={`h-6 w-6 ${card.tone}`} />
                </span>
              </div>
            </Surface>
          </AnimateOnScroll>
        )
      })}
    </div>
  )
}

function VisibilityBreakdown({ stats }: { stats: Stats }) {
  const percentage = stats.totalPhotos ? (stats.publicPhotos / stats.totalPhotos) * 100 : 0

  return (
    <Surface tone="panel" padding="lg" className="flex flex-col gap-6 shadow-subtle">
      <div>
        <Heading size="sm">Visibility</Heading>
        <Text tone="secondary" size="sm" className="mt-1">
          Quick overview of public and private inventory.
        </Text>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Eye className="h-4 w-4 text-emerald-500" />
            <span className="font-medium">Public</span>
          </div>
          <span className="text-sm font-semibold text-text-primary">{stats.publicPhotos}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <EyeOff className="h-4 w-4 text-text-muted" />
            <span className="font-medium">Private</span>
          </div>
          <span className="text-sm font-semibold text-text-primary">{stats.privatePhotos}</span>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>{percentage.toFixed(0)}% public</span>
            <span>{(100 - percentage).toFixed(0)}% private</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-surface-outline/40">
            <div
              className="h-2 rounded-full bg-emerald-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </Surface>
  )
}

function QuickActions() {
  return (
    <Surface tone="panel" padding="lg" className="flex flex-col gap-3 shadow-subtle">
      <Heading size="sm">Quick actions</Heading>
      <Text tone="secondary" size="sm">
        Jump into common workflows.
      </Text>
      <div className="space-y-3">
        <a
          href="/admin/upload"
          className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
        >
          <Upload className="h-4 w-4" />
          Upload new photos
        </a>
        <a
          href="/admin/albums"
          className="flex items-center gap-3 rounded-lg border border-surface-outline/40 bg-surface-canvas px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-surface-panel"
        >
          <FolderOpen className="h-4 w-4" />
          Manage albums
        </a>
      </div>
    </Surface>
  )
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  const stats = await getStats()

  return (
    <div className="space-y-12 pb-20 pt-6">
      <Container size="xl" bleed="none" className="flex flex-col gap-6">
        <AnimateOnScroll>
          <div className="space-y-2">
          <Heading size="lg">Dashboard</Heading>
          <Text tone="secondary">
            Welcome back{session?.user?.name ? `, ${session.user.name}` : ''}! Monitor library health and manage assets.
          </Text>
        </div>
        </AnimateOnScroll>

        <StatsCards stats={stats} />

        <AnimateOnScroll delay={0.08}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
            <VisibilityBreakdown stats={stats} />
            <QuickActions />
          </div>
        </AnimateOnScroll>

        <div className="space-y-4">
          <AnimateOnScroll>
            <div className="flex items-center justify-between">
              <Heading size="sm">Recent uploads</Heading>
            <Text tone="secondary" size="xs">
              Showing the six most recent entries
            </Text>
          </div>
          </AnimateOnScroll>
          <AnimateOnScroll delay={0.12}>
            <Surface tone="panel" padding="lg" className="shadow-subtle">
              <Suspense fallback={<Text tone="secondary">Loading recent photos…</Text>}>
              <RecentPhotos />
              </Suspense>
            </Surface>
          </AnimateOnScroll>
        </div>
      </Container>
    </div>
  )
}
