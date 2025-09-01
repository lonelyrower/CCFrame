import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const createAlbumSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  coverPhotoId: z.string().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const albums = await db.album.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            photos: {
              where: {
                status: 'COMPLETED'
              }
            }
          }
        },
        coverPhoto: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return NextResponse.json(albums)
  } catch (error) {
    console.error('Failed to fetch albums:', error)
    return NextResponse.json(
      { error: 'Failed to fetch albums' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = createAlbumSchema.parse(body)

    const album = await db.album.create({
      data: {
        ...data,
        userId: session.user.id
      },
      include: {
        _count: {
          select: {
            photos: true
          }
        },
        coverPhoto: {
          select: {
            id: true
          }
        }
      }
    })

    return NextResponse.json(album, { status: 201 })
  } catch (error) {
    console.error('Failed to create album:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create album' },
      { status: 500 }
    )
  }
}