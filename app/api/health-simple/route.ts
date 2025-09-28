import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Simple health check endpoint for Docker health checks
 * Returns 200 if the server is running, without checking external dependencies
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Server is running'
  })
}