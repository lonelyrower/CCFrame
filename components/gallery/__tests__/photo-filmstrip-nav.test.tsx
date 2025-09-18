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
    ],
    index: 0,
    go: goMock,
  })
}))

describe('PhotoFilmstrip interactions', () => {
  beforeEach(() => goMock.mockClear())

  it('invokes go when a different photo is clicked', () => {
    render(<PhotoFilmstrip />)
    const buttons = screen.getAllByRole('button', { name: /Jump to photo/ })
    fireEvent.click(buttons[1])
    expect(goMock).toHaveBeenCalledWith(1)
  })
})
