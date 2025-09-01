import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

type Params = { params: { id: string } }

export async function GET(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const job = await db.job.findFirst({
    where: { id: params.id, userId: session.user.id },
  })

  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ job })
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const job = await db.job.findFirst({
    where: { id: params.id, userId: session.user.id },
  })

  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (job.status === 'RUNNING') {
    return NextResponse.json({ error: 'Cannot delete a running job' }, { status: 400 })
  }

  await db.job.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}

