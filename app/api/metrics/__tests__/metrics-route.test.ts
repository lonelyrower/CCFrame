import { GET } from '@/app/api/metrics/route'
import { metricsRegistry, uploadEventCounter } from '@/lib/prometheus'

describe('Metrics route', () => {
  beforeEach(() => {
    metricsRegistry.resetMetrics()
  })

  it('returns Prometheus formatted metrics', async () => {
    uploadEventCounter.inc({ type: 'presign', result: 'success' })

    const response = await GET()
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('text/plain')

    const body = await response.text()
    expect(body).toContain('ccframe_upload_events_total')
    expect(body).toContain('type="presign"')
  })
})
