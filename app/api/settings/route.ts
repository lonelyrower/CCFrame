import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

const updateProfileSchema = z.object({
  email: z.string().email().optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(6).optional(),
})

const updateSiteSettingsSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  defaultVisibility: z.enum(['PUBLIC', 'PRIVATE']).optional(),
  allowPublicAccess: z.boolean().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return mock settings for now (could be stored in a settings table)
    const settings = {
      profile: {
        email: user.email,
        createdAt: user.createdAt
      },
      site: {
        title: 'CC Frame - 个人创意相册',
        description: 'CC Frame 是一个精美的个人相册网站，记录生活中的美好瞬间。',
        defaultVisibility: 'PUBLIC',
        allowPublicAccess: true
      },
      storage: {
        autoDeleteFailed: true,
        maxUploadSize: 50,
        compressionQuality: 85
      }
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { section, ...data } = body

    if (section === 'profile') {
      const validatedData = updateProfileSchema.parse(data)
      
      const user = await db.user.findUnique({
        where: { id: session.user.id }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const updateData: any = {}

      // Update email if provided
      if (validatedData.email && validatedData.email !== user.email) {
        // Check if email is already taken
        const existingUser = await db.user.findUnique({
          where: { email: validatedData.email }
        })
        
        if (existingUser && existingUser.id !== user.id) {
          return NextResponse.json(
            { error: 'Email already exists' },
            { status: 409 }
          )
        }
        
        updateData.email = validatedData.email
      }

      // Update password if provided
      if (validatedData.newPassword && validatedData.currentPassword) {
        const isValidPassword = await bcrypt.compare(
          validatedData.currentPassword,
          user.passwordHash
        )

        if (!isValidPassword) {
          return NextResponse.json(
            { error: 'Current password is incorrect' },
            { status: 400 }
          )
        }

        updateData.passwordHash = await bcrypt.hash(validatedData.newPassword, 12)
      }

      if (Object.keys(updateData).length > 0) {
        await db.user.update({
          where: { id: session.user.id },
          data: updateData
        })
      }

      return NextResponse.json({ success: true })
    }

    if (section === 'site') {
      const validatedData = updateSiteSettingsSchema.parse(data)
      // For now, just return success (could store in a settings table)
      return NextResponse.json({ success: true, settings: validatedData })
    }

    if (section === 'storage') {
      // For now, just return success (could store in a settings table)
      return NextResponse.json({ success: true, settings: data })
    }

    return NextResponse.json({ error: 'Invalid section' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update settings:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}