// Generic timing helper for CLI scripts & internal instrumentation
// Usage: await withTiming('step', async () => {...})

export async function withTiming<T>(label: string, fn: () => Promise<T>): Promise<{ result: T; ms: number }> {
  const start = Date.now()
  try {
    const result = await fn()
    const ms = Date.now() - start
    return { result, ms }
  } catch (e) {
    const ms = Date.now() - start
    ;(globalThis as any).console?.error?.(`[withTiming] ${label} failed after ${ms}ms:`, e)
    throw e
  }
}

export function timeSync<T>(label: string, fn: () => T): { result: T; ms: number } {
  const start = Date.now()
  const result = fn()
  return { result, ms: Date.now() - start }
}

export class TimingAggregate {
  private samples: number[] = []
  add(ms: number) { this.samples.push(ms) }
  summary() {
    if (!this.samples.length) return { count: 0, avgMs: 0, p95Ms: 0 }
    const sorted = [...this.samples].sort((a,b)=>a-b)
    const avg = this.samples.reduce((a,b)=>a+b,0)/this.samples.length
    const p95 = sorted[Math.min(sorted.length-1, Math.floor(sorted.length*0.95))]
    return { count: this.samples.length, avgMs: +avg.toFixed(1), p95Ms: +p95.toFixed(1) }
  }
}