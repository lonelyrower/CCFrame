import { Counter, Histogram, Registry, collectDefaultMetrics } from 'prom-client'

type PrometheusBundle = {
  registry: Registry
  imageProcessingHistogram: Histogram
  uploadEventCounter: Counter
  storageHealthCounter: Counter
  dbHealthCounter: Counter
  redisHealthCounter: Counter
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
  }
}

const bundle = globalScope.__ccframePrometheus!

export const metricsRegistry = bundle.registry
export const imageProcessingHistogram = bundle.imageProcessingHistogram
export const uploadEventCounter = bundle.uploadEventCounter
export const storageHealthCounter = bundle.storageHealthCounter
export const dbHealthCounter = bundle.dbHealthCounter
export const redisHealthCounter = bundle.redisHealthCounter