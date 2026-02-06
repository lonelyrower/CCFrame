import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { RATE_LIMIT_METRICS } from '@/lib/constants';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const limit = await rateLimit(
      `metrics:track:${ip}`,
      RATE_LIMIT_METRICS.max,
      RATE_LIMIT_METRICS.windowMs
    );
    if (!limit.allowed) {
      const retryAfter = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': retryAfter.toString() },
        }
      );
    }

    // Get today's date (UTC midnight)
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    // Get or create today's metrics
    await prisma.metricsDaily.upsert({
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
      const visitorId = crypto.randomUUID();
      response.cookies.set('visitor_id', visitorId, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
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
