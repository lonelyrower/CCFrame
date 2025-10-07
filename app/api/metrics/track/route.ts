import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get today's date (UTC midnight)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get or create today's metrics
    const metrics = await prisma.metricsDaily.upsert({
      where: { day: today },
      update: {
        pv: { increment: 1 },
      },
      create: {
        day: today,
        pv: 1,
        uv: 0,
      },
    });

    // Track unique visitor (simplified - in production use proper UV tracking)
    const visitorCookie = request.cookies.get('visitor_id');
    if (!visitorCookie) {
      await prisma.metricsDaily.update({
        where: { day: today },
        data: {
          uv: { increment: 1 },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking metrics:', error);
    return NextResponse.json(
      { error: 'Failed to track metrics' },
      { status: 500 }
    );
  }
}
