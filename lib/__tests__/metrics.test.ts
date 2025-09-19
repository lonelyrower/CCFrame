const imageProcessingHistogram = { observe: jest.fn() }
const embeddingGenerationHistogram = { observe: jest.fn() }
const embeddingGenerationCounter = { inc: jest.fn() }
const embeddingProviderHistogram = { observe: jest.fn() }
const embeddingProviderErrorCounter = { inc: jest.fn() }
const semanticApiLatencyHistogram = { observe: jest.fn() }
const semanticCacheCounter = { inc: jest.fn() }
const semanticFallbackCounter = { inc: jest.fn() }

jest.mock('../prometheus', () => ({
  imageProcessingHistogram,
  embeddingGenerationHistogram,
  embeddingGenerationCounter,
  embeddingProviderHistogram,
  embeddingProviderErrorCounter,
  semanticApiLatencyHistogram,
  semanticCacheCounter,
  semanticFallbackCounter,
}))

describe('metrics helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('aggregates image process timings', async () => {
    await jest.isolateModulesAsync(async () => {
      const { recordImageProcess, getImageTimingAverages } = await import('../metrics')
      recordImageProcess({ totalMs: 120, blurhashMs: 30, variantsMs: 60 })
      recordImageProcess({ totalMs: 80, blurhashMs: 20, variantsMs: 40 })

      const summary = getImageTimingAverages()

      expect(summary).toEqual({ count: 2, avgTotal: 100, avgBlurhash: 25, avgVariants: 50 })
      expect(imageProcessingHistogram.observe).toHaveBeenCalledTimes(6)
      expect(imageProcessingHistogram.observe.mock.calls).toEqual([
        [{ stage: 'total' }, 0.12],
        [{ stage: 'blurhash' }, 0.03],
        [{ stage: 'variants' }, 0.06],
        [{ stage: 'total' }, 0.08],
        [{ stage: 'blurhash' }, 0.02],
        [{ stage: 'variants' }, 0.04],
      ])
    })
  })

  it('tracks embedding generation outcomes', async () => {
    await jest.isolateModulesAsync(async () => {
      const { recordEmbeddingGeneration, getEmbeddingMetrics } = await import('../metrics')
      recordEmbeddingGeneration({ ms: 100, ok: true, model: 'clip' })
      recordEmbeddingGeneration({ ms: 220, ok: false, model: 'clip' })

      const metrics = getEmbeddingMetrics()

      expect(metrics.count).toBe(2)
      expect(metrics.success).toBe(1)
      expect(metrics.failed).toBe(1)
      expect(metrics.avgMs).toBe(160)
      expect(metrics.p95Ms).toBe(220)
      expect(metrics.modelTop[0]).toEqual({ model: 'clip', count: 2 })
      expect(embeddingGenerationHistogram.observe).toHaveBeenCalledWith({ model: 'clip', status: 'success' }, 0.1)
      expect(embeddingGenerationHistogram.observe).toHaveBeenCalledWith({ model: 'clip', status: 'error' }, 0.22)
      expect(embeddingGenerationCounter.inc).toHaveBeenCalledWith({ model: 'clip', status: 'success' })
      expect(embeddingGenerationCounter.inc).toHaveBeenCalledWith({ model: 'clip', status: 'error' })
    })
  })

  it('collects semantic api latency stats', async () => {
    await jest.isolateModulesAsync(async () => {
      const { recordSemanticApi, getSemanticApiMetrics, recordSemanticPgvectorFallback } = await import('../metrics')
      recordSemanticApi({ ms: 120, cached: true })
      recordSemanticApi({ ms: 240, cached: false })
      recordSemanticPgvectorFallback('timeout')

      const metrics = getSemanticApiMetrics()

      expect(metrics.count).toBe(2)
      expect(metrics.avgMs).toBe(180)
      expect(metrics.cacheHitRate).toBeCloseTo(0.5, 5)
      expect(semanticApiLatencyHistogram.observe).toHaveBeenCalledWith({ cached: 'true' }, 0.12)
      expect(semanticApiLatencyHistogram.observe).toHaveBeenCalledWith({ cached: 'false' }, 0.24)
      expect(semanticCacheCounter.inc).toHaveBeenCalledTimes(2)
      expect(semanticFallbackCounter.inc).toHaveBeenCalledWith({ result: 'error' })
      expect(metrics.shadow).toBeUndefined()
    })
  })
})
