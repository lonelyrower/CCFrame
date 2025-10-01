import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default('#6b7280')
})

export async function GET(request: NextRequest) {
  try {
    const tags = await db.tag.findMany({
      include: {
        _count: {
          select: {
            photoTags: {
              where: {
                photo: {
                  visibility: 'PUBLIC',
                  status: 'COMPLETED'
                }
              }
            }
          }
        }
      },
      where: {
        photoTags: {
          some: {
            photo: {
              visibility: 'PUBLIC',
              status: 'COMPLETED'
            }
          }
        }
      },
      orderBy: {
        photoTags: {
          _count: 'desc'
        }
      }
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error('Failed to fetch tags:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
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
    const data = createTagSchema.parse(body)

    // Check if tag already exists
    const existingTag = await db.tag.findUnique({
      where: {
        name: data.name
      }
    })

    if (existingTag) {
      return NextResponse.json(
        { error: 'Tag already exists' },
        { status: 409 }
      )
    }

    const tag = await db.tag.create({
      data,
      include: {
        _count: {
          select: {
            photoTags: true
          }
        }
      }
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Failed to create tag:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create tag' },
      { status: 500 }
    )
  }
}