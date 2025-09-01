import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { aiProcessingQueue } from '@/jobs/queue'
import { JobType } from '@prisma/client'
import { z } from 'zod'

const createJobSchema = z.object({
  photoId: z.string(),
  type: z.nativeEnum(JobType),
  params: z.record(z.any()).optional().default({})
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { photoId, type, params } = createJobSchema.parse(body)

    // Verify photo ownership
    const photo = await db.photo.findFirst({
      where: { id: photoId, userId: session.user.id }
    })

    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    if (photo.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Photo is not ready for processing' }, { status: 400 })
    }

    // Create job record
    const job = await db.job.create({
      data: {
        type,
        payloadJson: { photoId, ...params },
        userId: session.user.id,
        status: 'PENDING',
        progress: 0
      }
    })

    // Queue the job
    await aiProcessingQueue.add('ai-process', {
      jobId: job.id,
      photoId,
      taskType: type,
      params
    })

    return NextResponse.json({
      jobId: job.id,
      status: 'queued'
    })
  } catch (error) {
    console.error('AI job creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const photoId = url.searchParams.get('photoId')
    const status = url.searchParams.get('status')

    const where: any = {
      userId: session.user.id
    }

    if (photoId) {
      where.payloadJson = {
        path: ['photoId'],
        equals: photoId
      }
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const jobs = await db.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('AI jobs fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}