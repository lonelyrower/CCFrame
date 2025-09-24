'use client'

import React, { useMemo, useCallback, useState } from 'react'
import Image from 'next/image'
import { VariableSizeGrid } from 'react-window'
import AutoSizer from 'react-virtualized-auto-sizer'
import type { PhotoWithDetails } from '@/types'

interface VirtualizedGalleryProps {
  photos: PhotoWithDetails[]
  onPhotoClick: (photo: PhotoWithDetails, index: number) => void
  columnWidth?: number
  gap?: number
  overscanCount?: number
}

interface GridItemData {
  photos: PhotoWithDetails[]
  columnCount: number
  columnWidth: number
  gap: number
  onPhotoClick: (photo: PhotoWithDetails, index: number) => void
}

const GridItem = React.memo<{
  columnIndex: number
  rowIndex: number
  style: React.CSSProperties
  data: GridItemData
}>(({ columnIndex, rowIndex, style, data }) => {
  const { photos, columnCount, columnWidth, gap, onPhotoClick } = data
  const index = rowIndex * columnCount + columnIndex

  if (index >= photos.length) {
    return <div style={style} />
  }

  const photo = photos[index]
  const aspectRatio = photo.height > 0 ? photo.width / photo.height : 1

  return (
    <div
      style={{
        ...style,
        left: (style.left as number) + gap / 2,
        top: (style.top as number) + gap / 2,
        width: (style.width as number) - gap,
        height: (style.height as number) - gap,
      }}
      className="cursor-pointer group"
      onClick={() => onPhotoClick(photo, index)}
    >
      <div className="relative w-full h-full overflow-hidden rounded-lg bg-surface-panel dark:bg-surface-panel">
        {/* Blur hash placeholder */}
        {photo.blurhash && (
          <div
            className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-75"
            style={{
              backgroundImage: `url("data:image/svg+xml;base64,${btoa(
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${photo.width} ${photo.height}">
                  <rect width="100%" height="100%" fill="#f3f4f6"/>
                </svg>`
              )}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        )}

        {/* Lazy loaded image */}
        <Image
          src={`/api/image/${photo.id}/small?format=webp`}
          alt={photo.album?.title || photo.tags?.[0]?.tag?.name || 'Photo'}
          fill
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onError={(event) => {
            const img = event.currentTarget
            if (img.src.includes('webp')) {
              img.src = `/api/image/${photo.id}/small?format=jpeg`
            } else if (img.src.includes('/api/image/') && img.src.includes('small')) {
              img.src = `/api/image/${photo.id}/thumb?format=jpeg`
            } else if (!img.src.includes('serve')) {
              img.src = `/api/image/serve/${photo.id}/small?format=jpeg`
            }
          }}
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-contrast-surface bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />

        {/* Photo info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <p className="text-text-inverted text-sm font-medium truncate">
            {photo.album?.title || photo.tags?.[0]?.tag?.name || `Photo ${index + 1}`}
          </p>
          {photo.takenAt && (
            <p className="text-text-inverted/80 text-xs">
              {new Date(photo.takenAt).toLocaleDateString('zh-CN')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
})

GridItem.displayName = 'GridItem'

export const VirtualizedGallery: React.FC<VirtualizedGalleryProps> = ({
  photos,
  onPhotoClick,
  columnWidth = 250,
  gap = 16,
  overscanCount = 5
}) => {
  const [containerWidth, setContainerWidth] = useState(0)

  // Calculate grid layout
  const { columnCount, rowCount, getItemHeight } = useMemo(() => {
    const effectiveWidth = containerWidth - gap
    const columnsPerRow = Math.max(1, Math.floor(effectiveWidth / (columnWidth + gap)))
    const rows = Math.ceil(photos.length / columnsPerRow)

    // Calculate item height based on aspect ratio
    const getHeight = (rowIndex: number) => {
      const startIndex = rowIndex * columnsPerRow
      const endIndex = Math.min(startIndex + columnsPerRow, photos.length)
      let maxHeight = 200 // Minimum height

      for (let i = startIndex; i < endIndex; i++) {
        const photo = photos[i]
        if (photo && photo.height > 0) {
          const aspectRatio = photo.width / photo.height
          const itemHeight = columnWidth / aspectRatio
          maxHeight = Math.max(maxHeight, itemHeight)
        }
      }

      return Math.min(maxHeight + gap, 400) // Maximum height
    }

    return {
      columnCount: columnsPerRow,
      rowCount: rows,
      getItemHeight: getHeight
    }
  }, [containerWidth, columnWidth, gap, photos])

  // Grid item data
  const itemData: GridItemData = useMemo(() => ({
    photos,
    columnCount,
    columnWidth,
    gap,
    onPhotoClick
  }), [photos, columnCount, columnWidth, gap, onPhotoClick])

  // Column width calculator
  const getColumnWidth = useCallback(() => {
    return (containerWidth - gap) / columnCount
  }, [containerWidth, gap, columnCount])

  // Update container width when component mounts or resizes
  const handleResize = useCallback((width: number) => {
    setContainerWidth(width)
  }, [])

  if (photos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted dark:text-text-muted">
        <p>暂无照片</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full min-h-[400px]">
      <AutoSizer onResize={({ width }) => handleResize(width)}>
        {({ height, width }) => {
          if (!width || !height) return null

          return (
            <VariableSizeGrid
              columnCount={columnCount}
              columnWidth={getColumnWidth}
              height={height}
              rowCount={rowCount}
              rowHeight={getItemHeight}
              width={width}
              itemData={itemData}
              overscanRowCount={overscanCount}
              overscanColumnCount={overscanCount}
            >
              {GridItem}
            </VariableSizeGrid>
          )
        }}
      </AutoSizer>
    </div>
  )
}

export default VirtualizedGallery
