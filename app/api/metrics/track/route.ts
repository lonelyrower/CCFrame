import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get today's date (UTC midnight)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get or create today's metrics
    const _metrics = await prisma.metricsDaily.upsert({
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

    // Track unique visitor
    const visitorCookie = request.cookies.get('visitor_id');
    const response = NextResponse.json({ success: true });

    if (!visitorCookie) {
      // Generate a unique visitor ID and set cookie
      const visitorId = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
      response.cookies.set('visitor_id', visitorId, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
      });

      // Increment UV count
      await prisma.metricsDaily.update({
        where: { day: today },
        data: {
          uv: { increment: 1 },
        },
      });
    }

    return response;
  } catch (error) {
    console.error('Error tracking metrics:', error);
    return NextResponse.json(
      { error: 'Failed to track metrics' },
      { status: 500 }
    );
  }
}
