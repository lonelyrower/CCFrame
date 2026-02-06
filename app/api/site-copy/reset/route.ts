import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// POST reset site copy to default (admin only)
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.siteCopy.upsert({
      where: { id: 1 },
      update: { homeCopy: null, themeColor: null, themePreset: null },
      create: { id: 1, homeCopy: null, themeColor: null, themePreset: null },
    });
    revalidateTag('site-copy', 'max');

    return NextResponse.json({
      message: 'Site copy reset to default',
    });
  } catch (error) {
    console.error('Error resetting site copy:', error);
    return NextResponse.json(
      { error: 'Failed to reset site copy' },
      { status: 500 }
    );
  }
}
