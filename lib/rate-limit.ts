import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

const fallbackStore = new Map<string, RateLimitEntry>();

// 定期清理过期条目（每5分钟清理一次）
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupFallbackStore(now: number) {
  for (const [key, entry] of fallbackStore.entries()) {
    if (now > entry.resetAt) {
      fallbackStore.delete(key);
    }
  }
}

async function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  cleanupFallbackStore(now);

  try {
    await prisma.rateLimit.deleteMany({
      where: {
        resetAt: {
          lt: new Date(now),
        },
      },
    });
  } catch {
    // 数据库不可用时继续使用内存降级限流
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

function rateLimitFallback(key: string, limit: number, windowMs: number): RateLimitResult {
  cleanupFallbackStore(Date.now());

  const now = Date.now();
  const entry = fallbackStore.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    fallbackStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  fallbackStore.set(key, entry);

  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  await cleanupExpiredEntries();

  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.rateLimit.upsert({
        where: { key },
        update: {},
        create: {
          key,
          count: 0,
          resetAt,
        },
      });

      const current = await tx.rateLimit.findUnique({
        where: { key },
        select: { count: true, resetAt: true },
      });

      if (!current) {
        return rateLimitFallback(key, limit, windowMs);
      }

      if (current.resetAt <= now) {
        await tx.rateLimit.update({
          where: { key },
          data: {
            count: 1,
            resetAt,
          },
        });
        return {
          allowed: true,
          remaining: limit - 1,
          resetAt: resetAt.getTime(),
        };
      }

      const updated = await tx.rateLimit.updateMany({
        where: {
          key,
          resetAt: { gt: now },
          count: { lt: limit },
        },
        data: {
          count: { increment: 1 },
        },
      });

      const latest = await tx.rateLimit.findUnique({
        where: { key },
        select: { count: true, resetAt: true },
      });

      if (!latest) {
        return rateLimitFallback(key, limit, windowMs);
      }

      if (updated.count === 0) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: latest.resetAt.getTime(),
        };
      }

      return {
        allowed: true,
        remaining: Math.max(0, limit - latest.count),
        resetAt: latest.resetAt.getTime(),
      };
    });
  } catch {
    return rateLimitFallback(key, limit, windowMs);
  }
}
