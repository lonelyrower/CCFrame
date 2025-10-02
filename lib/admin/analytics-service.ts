/**
 * Analytics Service
 * 提供数据可视化所需的统计数据
 */

import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export interface UploadTrendData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
  }[]
}

export interface StorageDistribution {
  labels: string[]
  data: number[]
  percentages: number[]
}

export interface VisitorStats {
  labels: string[]
  data: number[]
}

export interface TagUsageStats {
  name: string
  count: number
}

export interface AnalyticsData {
  uploadTrend: UploadTrendData
  storageDist: StorageDistribution
  visitorStats: VisitorStats
  topTags: TagUsageStats[]
  generatedAt: string
}

/**
 * 获取上传趋势数据
 */
export async function getUploadTrend(range: '7d' | '30d' | '90d' = '30d'): Promise<UploadTrendData> {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  try {
    // 查询时间范围内的照片
    const photos = await db.photo.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    })

    // 按天聚合数据
    const dailyMap = new Map<string, number>()
    
    // 初始化所有日期为 0
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateKey = formatDate(date)
      dailyMap.set(dateKey, 0)
    }

    // 统计每天的上传量
    photos.forEach(photo => {
      const dateKey = formatDate(photo.createdAt)
      dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + 1)
    })

    // 转换为图表数据格式
    const labels = Array.from(dailyMap.keys())
    const data = Array.from(dailyMap.values())

    return {
      labels,
      datasets: [{
        label: '上传数量',
        data
      }]
    }
  } catch (error) {
    logger.error('Failed to get upload trend:', error)
    return {
      labels: [],
      datasets: [{ label: '上传数量', data: [] }]
    }
  }
}

/**
 * 获取存储空间分布
 */
export async function getStorageDistribution(): Promise<StorageDistribution> {
  try {
    const [original, thumb, medium, large] = await Promise.all([
      db.photoVariant.aggregate({
        where: { variant: 'original' },
        _sum: { sizeBytes: true }
      }),
      db.photoVariant.aggregate({
        where: { variant: 'thumb' },
        _sum: { sizeBytes: true }
      }),
      db.photoVariant.aggregate({
        where: { variant: 'medium' },
        _sum: { sizeBytes: true }
      }),
      db.photoVariant.aggregate({
        where: { variant: 'large' },
        _sum: { sizeBytes: true }
      })
    ])

    const originalSize = original._sum.sizeBytes || 0
    const thumbSize = thumb._sum.sizeBytes || 0
    const mediumSize = medium._sum.sizeBytes || 0
    const largeSize = large._sum.sizeBytes || 0
    const totalSize = originalSize + thumbSize + mediumSize + largeSize

    const data = [originalSize, thumbSize, mediumSize, largeSize]
    const percentages = data.map(size => 
      totalSize > 0 ? Math.round((size / totalSize) * 100) : 0
    )

    return {
      labels: ['原图', '缩略图', '中等尺寸', '高清预览'],
      data,
      percentages
    }
  } catch (error) {
    logger.error('Failed to get storage distribution:', error)
    return {
      labels: ['原图', '缩略图', '中等尺寸', '高清预览'],
      data: [0, 0, 0, 0],
      percentages: [0, 0, 0, 0]
    }
  }
}

/**
 * 获取访问统计（模拟数据，需要接入真实的 Analytics）
 */
export async function getVisitorStatistics(range: '7d' | '30d' = '7d'): Promise<VisitorStats> {
  const days = range === '7d' ? 7 : 30
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  startDate.setHours(0, 0, 0, 0)

  try {
    // TODO: 接入真实的访问统计（Google Analytics / Umami / Plausible）
    // 这里使用模拟数据演示
    const labels: string[] = []
    const data: number[] = []

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      labels.push(formatDate(date))
      // 模拟访问量（实际应从 Analytics API 获取）
      data.push(Math.floor(Math.random() * 100) + 50)
    }

    return { labels, data }
  } catch (error) {
    logger.error('Failed to get visitor statistics:', error)
    return { labels: [], data: [] }
  }
}

/**
 * 获取标签使用统计
 */
export async function getTopTags(limit: number = 10): Promise<TagUsageStats[]> {
  try {
    const tags = await db.tag.findMany({
      include: {
        _count: {
          select: { 
            photoTags: true  // 修复：使用 photoTags 关系
          }
        }
      },
      orderBy: {
        photoTags: { _count: 'desc' }  // 修复：使用 photoTags 关系
      },
      take: limit
    })

    return tags.map(tag => ({
      name: tag.name,
      count: tag._count.photoTags  // 修复：使用 photoTags
    }))
  } catch (error) {
    logger.error('Failed to get top tags:', error)
    return []
  }
}

/**
 * 获取完整的分析数据
 */
export async function getAnalyticsData(
  uploadRange: '7d' | '30d' | '90d' = '30d',
  visitorRange: '7d' | '30d' = '7d'
): Promise<AnalyticsData> {
  const [uploadTrend, storageDist, visitorStats, topTags] = await Promise.all([
    getUploadTrend(uploadRange),
    getStorageDistribution(),
    getVisitorStatistics(visitorRange),
    getTopTags(10)
  ])

  return {
    uploadTrend,
    storageDist,
    visitorStats,
    topTags,
    generatedAt: new Date().toISOString()
  }
}

/**
 * 格式化日期为 MM/DD 格式
 */
function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}/${day}`
}

/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}
