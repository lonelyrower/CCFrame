import exifr from 'exifr'

export interface ExifData {
  camera?: string
  lens?: string
  focalLength?: number
  aperture?: number
  iso?: number
  shutterSpeed?: string
  takenAt?: Date
  location?: {
    lat: number
    lng: number
  }
  orientation?: number
}

export class ExifProcessor {
  static async extractExif(buffer: Buffer): Promise<ExifData | null> {
    try {
      const exifData = await exifr.parse(buffer, {
        pick: [
          'Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ISO', 
          'ExposureTime', 'DateTimeOriginal', 'GPSLatitude', 'GPSLongitude',
          'Orientation'
        ]
      })

      if (!exifData) return null

      const result: ExifData = {}

      // Camera info
      if (exifData.Make && exifData.Model) {
        result.camera = `${exifData.Make} ${exifData.Model}`.trim()
      }

      if (exifData.LensModel) {
        result.lens = exifData.LensModel
      }

      // Technical data
      if (exifData.FocalLength) {
        result.focalLength = Math.round(exifData.FocalLength)
      }

      if (exifData.FNumber) {
        result.aperture = Math.round(exifData.FNumber * 10) / 10
      }

      if (exifData.ISO) {
        result.iso = exifData.ISO
      }

      if (exifData.ExposureTime) {
        if (exifData.ExposureTime >= 1) {
          result.shutterSpeed = `${exifData.ExposureTime}s`
        } else {
          result.shutterSpeed = `1/${Math.round(1 / exifData.ExposureTime)}`
        }
      }

      // Date taken
      if (exifData.DateTimeOriginal) {
        result.takenAt = new Date(exifData.DateTimeOriginal)
      }

      // GPS location
      if (exifData.GPSLatitude && exifData.GPSLongitude) {
        result.location = {
          lat: Number(exifData.GPSLatitude),
          lng: Number(exifData.GPSLongitude)
        }
      }

      // Orientation
      if (exifData.Orientation) {
        result.orientation = exifData.Orientation
      }

      return result
    } catch (error) {
      console.error('Failed to extract EXIF:', error)
      return null
    }
  }

  static shouldRotateImage(orientation?: number): boolean {
    return orientation ? orientation > 1 : false
  }

  static getRotationAngle(orientation?: number): number {
    switch (orientation) {
      case 3: return 180
      case 6: return 90
      case 8: return -90
      default: return 0
    }
  }

  static cleanSensitiveExif(exifData: ExifData, options: {
    removeLocation?: boolean
    removeCamera?: boolean
  } = {
    removeLocation: true, // 默认移除位置信息
    removeCamera: false
  }): ExifData {
    const cleaned = { ...exifData }

    if (options.removeLocation) {
      delete cleaned.location
    }

    if (options.removeCamera) {
      delete cleaned.camera
      delete cleaned.lens
    }

    return cleaned
  }

  /**
   * 获取安全的EXIF数据（默认清理敏感信息）
   */
  static getSafeExifData(exifData: ExifData): ExifData {
    return this.cleanSensitiveExif(exifData, {
      removeLocation: process.env.EXIF_REMOVE_LOCATION !== 'false',
      removeCamera: process.env.EXIF_REMOVE_CAMERA === 'true'
    })
  }
}