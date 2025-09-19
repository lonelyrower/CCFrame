import { imageProcessingQueue } from '@/jobs/queue'

// Mock bullmq dynamic import by pre-populating an in-memory add capture
jest.mock('bullmq', () => {
  class FakeQueue {
    name: string
    jobs: any[] = []
    constructor(name: string) { this.name = name }
    add(name: string, data: any, opts?: any) {
      this.jobs.push({ name, data, opts })
      return Promise.resolve({ id: 'job1', name, data })
    }
  }
  return { Queue: FakeQueue }
})

jest.mock('@/lib/redis', () => ({ getRedis: () => Promise.resolve({}) }))

describe('imageProcessingQueue', () => {
  test('adds job to underlying queue', async () => {
    const result: any = await imageProcessingQueue.add('process-image', { photoId: 'p1', fileKey: 'originals/x.jpg', userId: 'u1' })
    expect(result.name).toBe('process-image')
    expect(result.data.photoId).toBe('p1')
  })
})
