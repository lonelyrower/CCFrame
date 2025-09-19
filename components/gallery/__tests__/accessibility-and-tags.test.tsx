import React from 'react'
import { render, fireEvent } from '@testing-library/react'
import { LightboxProvider } from '../lightbox-context'
import { PhotoModal } from '../photo-modal'

const photos: any = [{
  id: 'p1', width: 100, height: 60, fileKey: 'p1.jpg', hash: 'h', visibility: 'PUBLIC', status: 'COMPLETED', userId: 'u', createdAt: new Date(), updatedAt: new Date(), tags: [{ tag: { id: 't1', name: 'foo', color: '#111' } }], variants: [], faces: [], albumCovers: [], smartAlbumCovers: [], album: null, exifJson: null
}]

describe('Lightbox accessibility & tags inline edit', () => {
  it('toggles tag edit mode', async () => {
    const { findByRole, queryByPlaceholderText } = render(
      <LightboxProvider photos={photos}>
        <PhotoModal photo={photos[0]} photos={photos} onClose={() => {}} onNext={() => {}} onPrevious={() => {}} />
      </LightboxProvider>
    )
    const editButton = await findByRole('button', { name: '编辑' })
    fireEvent.click(editButton)
    expect(queryByPlaceholderText('添加标签')).toBeTruthy()
    const doneButton = await findByRole('button', { name: '完成' })
    fireEvent.click(doneButton)
    expect(queryByPlaceholderText('添加标签')).toBeFalsy()
  })
})
