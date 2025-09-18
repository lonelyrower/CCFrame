import {
  imageProcessingHistogram,
} from './prometheus'

interface TimingSample {
  totalMs: number
  blurhashMs: number
  variantsMs: number
  ts: number
}

const RING_SIZE = 200
const ring: TimingSample[] = []

export function recordImageProcess(t: { totalMs: number; blurhashMs: number; variantsMs: number }) {
  imageProcessingHistogram.observe({ stage: 'total' }, t.totalMs / 1000)
  imageProcessingHistogram.observe({ stage: 'blurhash' }, t.blurhashMs / 1000)
  imageProcessingHistogram.observe({ stage: 'variants' }, t.variantsMs / 1000)
  ring.push({ ...t, ts: Date.now() })
  if (ring.length > RING_SIZE) ring.shift()
}

export function getImageTimingAverages() {
  if (!ring.length) return { count: 0, avgTotal: 0, avgBlurhash: 0, avgVariants: 0 }
  const sum = ring.reduce((acc, s) => {
    acc.total += s.totalMs
    acc.blur += s.blurhashMs
    acc.vars += s.variantsMs
    return acc
  }, { total: 0, blur: 0, vars: 0 })
  return {
    count: ring.length,
    avgTotal: +(sum.total / ring.length).toFixed(1),
    avgBlurhash: +(sum.blur / ring.length).toFixed(1),
    avgVariants: +(sum.vars / ring.length).toFixed(1)
  }
}