import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateAlbumSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  coverPhotoId: z.string().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const album = await db.album.findFirst({
      where: {
        id: params.id,
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
        },
        photos: {
          where: {
            status: 'COMPLETED'
          },
          include: {
            variants: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 20
        }
      }
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    return NextResponse.json(album)
  } catch (error) {
    console.error('Failed to fetch album:', error)
    return NextResponse.json(
      { error: 'Failed to fetch album' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateAlbumSchema.parse(body)

    const album = await db.album.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    const updatedAlbum = await db.album.update({
      where: {
        id: params.id
      },
      data,
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
      }
    })

    return NextResponse.json(updatedAlbum)
  } catch (error) {
    console.error('Failed to update album:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update album' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const album = await db.album.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!album) {
      return NextResponse.json({ error: 'Album not found' }, { status: 404 })
    }

    // First, update all photos in this album to remove the album reference
    await db.photo.updateMany({
      where: {
        albumId: params.id
      },
      data: {
        albumId: null
      }
    })

    // Then delete the album
    await db.album.delete({
      where: {
        id: params.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete album:', error)
    return NextResponse.json(
      { error: 'Failed to delete album' },
      { status: 500 }
    )
  }
}