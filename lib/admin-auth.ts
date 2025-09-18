import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

type SessionWithAdminUser = Session & { user: NonNullable<Session['user']> & { id: string } }

export type AdminGuardSuccess = {
  session: SessionWithAdminUser
  adminUserId: string
  adminEmail: string
}

export async function requireAdmin(): Promise<AdminGuardSuccess | NextResponse> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.error('ADMIN_EMAIL is not configured; denying admin access')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }

  const expectedEmail = adminEmail.toLowerCase()
  const sessionEmail = (session.user.email || '').toLowerCase()
  if (sessionEmail !== expectedEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userRecord = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true },
  })

  if (!userRecord || userRecord.email.toLowerCase() !== expectedEmail) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return {
    session: session as SessionWithAdminUser,
    adminUserId: userRecord.id,
    adminEmail: userRecord.email,
  }
}
