import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import toast from 'react-hot-toast'
import { PhotoActions } from '../photo-actions'

jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: jest.fn() } }))

describe('PhotoActions', () => {
  const originalFetch = global.fetch
  const fetchMock = jest.fn()
  const confirmMock = jest.fn()
  const openMock = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global as any).fetch = fetchMock
    ;(global as any).confirm = confirmMock
    ;(global as any).open = openMock
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) })
    confirmMock.mockReturnValue(true)
  })

  afterAll(() => {
    if (originalFetch) {
      ;(global as any).fetch = originalFetch
    }
    delete (global as any).confirm
    delete (global as any).open
  })

  it('toggles visibility and notifies parent', async () => {
    const onChanged = jest.fn()
    render(<PhotoActions photoId="p1" visibility="PUBLIC" onChanged={onChanged} />)

    const toggleButton = screen.getByRole('button', { name: '设为私密' })
    fireEvent.click(toggleButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/photos/p1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: 'PRIVATE' }),
      })
    })

    expect((toast as any).success).toHaveBeenCalledWith('已设为私密')
    expect(onChanged).toHaveBeenCalledWith('PRIVATE')
  })

  it('deletes photo when confirmed', async () => {
    const onChanged = jest.fn()
    render(<PhotoActions photoId="p2" visibility="PRIVATE" onChanged={onChanged} />)

    const deleteButton = screen.getByRole('button', { name: '删除' })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/photos/p2', { method: 'DELETE' })
    })

    expect((toast as any).success).toHaveBeenCalledWith('已删除')
    expect(onChanged).toHaveBeenCalledWith('DELETED')
  })

  it('shows error toast when delete fails', async () => {
    confirmMock.mockReturnValue(true)
    fetchMock.mockResolvedValue({ ok: false })
    render(<PhotoActions photoId="p3" visibility="PRIVATE" />)

    const deleteButton = screen.getByRole('button', { name: '删除' })
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect((toast as any).error).toHaveBeenCalledWith('删除失败')
    })
  })
})
