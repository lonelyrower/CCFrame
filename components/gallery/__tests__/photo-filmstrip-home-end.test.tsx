import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PhotoFilmstrip } from '../photo-filmstrip'

const goMock = jest.fn()

jest.mock('../lightbox-context', () => ({
  useLightbox: () => ({
    photos: [
      { id: 'a', width: 10, height: 10, fileKey: 'x/a.jpg', album: null },
      { id: 'b', width: 10, height: 10, fileKey: 'x/b.jpg', album: null },
      { id: 'c', width: 10, height: 10, fileKey: 'x/c.jpg', album: null },
      { id: 'd', width: 10, height: 10, fileKey: 'x/d.jpg', album: null },
    ],
    index: 2,
    go: goMock,
  })
}))

describe('PhotoFilmstrip selection', () => {
  beforeEach(() => goMock.mockClear())

  it('selects first photo when first button clicked', () => {
    render(<PhotoFilmstrip />)
    const buttons = screen.getAllByRole('button', { name: /Jump to photo/ })
    fireEvent.click(buttons[0])
    expect(goMock).toHaveBeenCalledWith(0)
  })

  it('selects last photo when last button clicked', () => {
    render(<PhotoFilmstrip />)
    const buttons = screen.getAllByRole('button', { name: /Jump to photo/ })
    fireEvent.click(buttons[buttons.length - 1])
    expect(goMock).toHaveBeenCalledWith(3)
  })
})
