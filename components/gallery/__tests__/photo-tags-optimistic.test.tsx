import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LightboxProvider } from '../lightbox-context'
import { PhotoModal } from '../photo-modal'
import { photoTagsStore } from '../photo-tags-store'

jest.mock('react-hot-toast', () => ({ __esModule: true, default: { error: jest.fn(), success: jest.fn() } }))

const basePhoto: any = {
  id: 'p1',
  title: 'Test Photo',
  width: 1000,
  height: 800,
  createdAt: new Date().toISOString(),
  variants: [],
  album: null,
  tags: [],
  exif: null,
  lat: null,
  lng: null,
  blurhash: null,
}

function renderModal(photo = basePhoto) {
  return render(
    <LightboxProvider photos={[photo]}>
      <PhotoModal photo={photo} photos={[photo]} onClose={() => {}} onNext={() => {}} onPrevious={() => {}} />
    </LightboxProvider>
  )
}

const openTagEditor = async () => {
  await screen.findByText((content) => content.includes('标签'))
  const editBtn = screen.getAllByRole('button').find(btn => btn.textContent?.includes('编辑'))
  if (!editBtn) throw new Error('编辑 button not found')
  await act(async () => { fireEvent.click(editBtn) })
}

describe('PhotoModal tag optimistic updates', () => {
  beforeEach(() => {
    photoTagsStore.clear()
    ;(global as any).fetch = jest.fn()
  })

  it('adds a tag optimistically and replaces temp id after success', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ tag: { id: 'real-1', name: 'bird', color: '#111' } }) })
    const photoWithTag = { ...basePhoto, tags: [{ tag: { id: 'seed', name: 'seed' } }] }
    renderModal(photoWithTag)

    await openTagEditor()

    const input = screen.getByPlaceholderText('添加标签')
    fireEvent.change(input, { target: { value: 'bird' } })
    await act(async () => { fireEvent.submit(input.closest('form')!) })

    await waitFor(() => expect(screen.queryAllByText('bird').length).toBeGreaterThan(0))
    await waitFor(() => expect(fetch).toHaveBeenCalled())
  })

  it('rolls back tag on failure', async () => {
    ;(fetch as jest.Mock).mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ ok: false }), 0)))
    const photoWithTag = { ...basePhoto, tags: [{ tag: { id: 't1', name: 'landscape' } }] }
    renderModal(photoWithTag)

    await openTagEditor()

    const input = screen.getByPlaceholderText('添加标签')
    fireEvent.change(input, { target: { value: 'failtag' } })
    await act(async () => { fireEvent.submit(input.closest('form')!) })

    await waitFor(() => expect(fetch).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByText('failtag')).not.toBeInTheDocument())
  })
})
