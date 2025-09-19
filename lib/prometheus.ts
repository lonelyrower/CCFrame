import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client'

type PrometheusBundle = {
  registry: Registry
  imageProcessingHistogram: Histogram
  uploadEventCounter: Counter
  storageHealthCounter: Counter
  dbHealthCounter: Counter
  redisHealthCounter: Counter
  embeddingGenerationHistogram: Histogram
  embeddingGenerationCounter: Counter
  embeddingProviderHistogram: Histogram
  embeddingProviderErrorCounter: Counter
  semanticApiLatencyHistogram: Histogram
  semanticCacheCounter: Counter
  semanticFallbackCounter: Counter
}

const globalScope = globalThis as unknown as { __ccframePrometheus?: PrometheusBundle }

if (!globalScope.__ccframePrometheus) {
  const registry = new Registry()
  collectDefaultMetrics({ register: registry, prefix: 'ccframe_' })
  const histogramBucketsSeconds = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10]

  globalScope.__ccframePrometheus = {
    registry,
    imageProcessingHistogram: new Histogram({
      name: 'ccframe_image_processing_stage_duration_seconds',
      help: 'Duration of image processing stages in seconds',
      labelNames: ['stage'],
      buckets: histogramBucketsSeconds,
      registers: [registry],
    }),
    uploadEventCounter: new Counter({
      name: 'ccframe_upload_events_total',
      help: 'Upload events grouped by type and result',
      labelNames: ['type', 'result'],
      registers: [registry],
    }),
    storageHealthCounter: new Counter({
      name: 'ccframe_storage_health_checks_total',
      help: 'Storage health check results grouped by status',
      labelNames: ['status'],
      registers: [registry],
    }),
    dbHealthCounter: new Counter({
      name: 'ccframe_db_health_checks_total',
      help: 'Database health check attempts grouped by status',
      labelNames: ['status'],
      registers: [registry],
    }),
    redisHealthCounter: new Counter({
      name: 'ccframe_redis_health_checks_total',
      help: 'Redis health check attempts grouped by status',
      labelNames: ['status'],
      registers: [registry],
    }),
    embeddingGenerationHistogram: new Histogram({
      name: 'ccframe_embedding_generation_duration_seconds',
      help: 'Embedding generation durations grouped by model & status',
      labelNames: ['model', 'status'],
      buckets: histogramBucketsSeconds,
      registers: [registry],
    }),
    embeddingGenerationCounter: new Counter({
      name: 'ccframe_embedding_generation_total',
      help: 'Embedding generation attempts grouped by model & status',
      labelNames: ['model', 'status'],
      registers: [registry],
    }),
    embeddingProviderHistogram: new Histogram({
      name: 'ccframe_embedding_provider_duration_seconds',
      help: 'External embedding provider latency grouped by provider & status',
      labelNames: ['provider', 'status'],
      buckets: histogramBucketsSeconds,
      registers: [registry],
    }),
    embeddingProviderErrorCounter: new Counter({
      name: 'ccframe_embedding_provider_errors_total',
      help: 'Embedding provider error count grouped by provider & error label',
      labelNames: ['provider', 'error'],
      registers: [registry],
    }),
    semanticApiLatencyHistogram: new Histogram({
      name: 'ccframe_semantic_api_latency_seconds',
      help: 'Semantic search API latency grouped by cache status',
      labelNames: ['cached'],
      buckets: histogramBucketsSeconds,
      registers: [registry],
    }),
    semanticCacheCounter: new Counter({
      name: 'ccframe_semantic_cache_events_total',
      help: 'Semantic search cache events grouped by status',
      labelNames: ['status'],
      registers: [registry],
    }),
    semanticFallbackCounter: new Counter({
      name: 'ccframe_semantic_fallback_total',
      help: 'Semantic pgvector fallback events grouped by result',
      labelNames: ['result'],
      registers: [registry],
    }),
  }
}

const bundle = globalScope.__ccframePrometheus!

export const metricsRegistry = bundle.registry
export const imageProcessingHistogram = bundle.imageProcessingHistogram
export const uploadEventCounter = bundle.uploadEventCounter
export const storageHealthCounter = bundle.storageHealthCounter
export const dbHealthCounter = bundle.dbHealthCounter
export const redisHealthCounter = bundle.redisHealthCounter
export const embeddingGenerationHistogram = bundle.embeddingGenerationHistogram
export const embeddingGenerationCounter = bundle.embeddingGenerationCounter
export const embeddingProviderHistogram = bundle.embeddingProviderHistogram
export const embeddingProviderErrorCounter = bundle.embeddingProviderErrorCounter
export const semanticApiLatencyHistogram = bundle.semanticApiLatencyHistogram
export const semanticCacheCounter = bundle.semanticCacheCounter
export const semanticFallbackCounter = bundle.semanticFallbackCounter
