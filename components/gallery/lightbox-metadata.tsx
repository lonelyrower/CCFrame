'use client'

import type { ReactNode } from 'react'
import { Camera, MapPin, PictureInPicture2, Tag } from 'lucide-react'
import type { PhotoWithDetails } from '@/types'
import { formatDate } from '@/lib/utils'

export type LightboxSectionKey = 'meta' | 'camera' | 'tags' | 'location'

export interface LightboxTag {
  id: string
  name: string
  color?: string | null
}

interface LightboxMetadataProps {
  photo: PhotoWithDetails
  collapsed: Record<LightboxSectionKey, boolean>
  onToggle: (key: LightboxSectionKey) => void
  tags?: LightboxTag[]
}

export function LightboxMetadata({ photo, collapsed, onToggle, tags }: LightboxMetadataProps) {
  const exifData = photo.exifJson as any
  const location = (photo.location as any) || null
  const camera = exifData?.camera || null
  const lens = exifData?.lens || null
  const resolvedTags = tags ?? photo.tags.map(t => t.tag)
  const capturedOn = photo.takenAt ? formatDate(photo.takenAt) : formatDate(photo.createdAt)

  return (
    <aside className="flex w-full max-w-xs flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white shadow-soft backdrop-blur-xl">
      <header className="space-y-1">
        <h3 className="text-base font-semibold">Photo Details</h3>
        <p className="text-xs text-white/60">Captured on {capturedOn}</p>
      </header>

      <Section
        title="Basics"
        icon={<PictureInPicture2 className="h-4 w-4" />}
        collapsed={collapsed.meta}
        onToggle={() => onToggle('meta')}
      >
        <dl className="space-y-2 text-xs">
          <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
            <span className="text-white/70">Dimensions</span>
            <span>{photo.width} x {photo.height}</span>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
            <span className="text-white/70">File name</span>
            <span>{photo.fileKey?.split('/').pop() || 'Unknown'}</span>
          </div>
        </dl>
      </Section>

      <Section
        title="Camera"
        icon={<Camera className="h-4 w-4" />}
        collapsed={collapsed.camera}
        onToggle={() => onToggle('camera')}
      >
        <ul className="space-y-2 text-xs">
          {camera && <li className="rounded-lg bg-white/10 px-3 py-2">Camera: {camera}</li>}
          {lens && <li className="rounded-lg bg-white/10 px-3 py-2">Lens: {lens}</li>}
          {exifData?.aperture && (
            <li className="rounded-lg bg-white/10 px-3 py-2">Aperture: f/{exifData.aperture}</li>
          )}
          {exifData?.shutterSpeed && (
            <li className="rounded-lg bg-white/10 px-3 py-2">Shutter: {exifData.shutterSpeed}s</li>
          )}
          {exifData?.iso && (
            <li className="rounded-lg bg-white/10 px-3 py-2">ISO: {exifData.iso}</li>
          )}
        </ul>
      </Section>

      <Section
        title="Tags"
        icon={<Tag className="h-4 w-4" />}
        collapsed={collapsed.tags}
        onToggle={() => onToggle('tags')}
      >
        <div className="flex flex-wrap gap-2">
          {resolvedTags.length === 0 && (
            <span className="text-xs text-white/60">No tags</span>
          )}
          {resolvedTags.map(tag => (
            <span
              key={tag.id || tag.name}
              className="rounded-full bg-white/10 px-2 py-1 text-xs"
            >
              {tag.name}
            </span>
          ))}
        </div>
      </Section>

      {location && typeof location.lat === 'number' && typeof location.lng === 'number' && (
        <Section
          title="Location"
          icon={<MapPin className="h-4 w-4" />}
          collapsed={collapsed.location}
          onToggle={() => onToggle('location')}
        >
          <div className="space-y-2 text-xs">
            <div className="rounded-lg bg-white/10 px-3 py-2 text-white/80">
              {location.address || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
            </div>
            <div className="overflow-hidden rounded-xl bg-white/5">
              <canvas
                className="h-28 w-full"
                ref={el => {
                  if (!el) return
                  const ctx = el.getContext('2d')
                  if (!ctx) return
                  const width = (el.width = el.clientWidth)
                  const height = (el.height = el.clientHeight)
                  ctx.fillStyle = '#0f172a'
                  ctx.fillRect(0, 0, width, height)
                  const x = ((location.lng + 180) / 360) * width
                  const y = ((90 - location.lat) / 180) * height
                  ctx.fillStyle = '#38bdf8'
                  ctx.beginPath()
                  ctx.arc(x, y, 6, 0, Math.PI * 2)
                  ctx.fill()
                }}
              />
            </div>
          </div>
        </Section>
      )}
    </aside>
  )
}

// TODO(lightbox): swap to richer map visualization once geo clustering ships.
function Section({
  title,
  icon,
  collapsed,
  onToggle,
  children,
}: {
  title: string
  icon: ReactNode
  collapsed?: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.2em] text-white/80 transition hover:bg-white/15"
        aria-expanded={!collapsed}
      >
        <span className="flex items-center gap-2 text-white">
          {icon}
          {title}
        </span>
        <span>{collapsed ? 'Show' : 'Hide'}</span>
      </button>
      {!collapsed && <div className="space-y-2 text-sm text-white/80">{children}</div>}
    </div>
  )
}
