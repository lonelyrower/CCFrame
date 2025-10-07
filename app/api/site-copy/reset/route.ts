import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// POST reset site copy to default (admin only)
export async function POST() {
  try {
    await prisma.siteCopy.upsert({
      where: { id: 1 },
      update: { homeCopy: null, themeColor: null },
      create: { id: 1, homeCopy: null, themeColor: null },
    });

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
