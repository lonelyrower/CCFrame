import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PhotoFilmstrip } from '../photo-filmstrip'

jest.mock('../lightbox-context', () => ({
  useLightbox: () => ({
    photos: [
      { id: 'a', width: 10, height: 10, fileKey: 'x/a.jpg', album: null },
      { id: 'b', width: 10, height: 10, fileKey: 'x/b.jpg', album: null },
      { id: 'c', width: 10, height: 10, fileKey: 'x/c.jpg', album: null },
    ],
    index: 0,
    go: jest.fn(),
  })
}))

describe('PhotoFilmstrip accessibility', () => {
  it('renders buttons with descriptive labels', () => {
    render(<PhotoFilmstrip />)
    const buttons = screen.getAllByRole('button', { name: /Jump to photo/ })
    expect(buttons).toHaveLength(3)
    buttons.forEach((btn, i) => {
      expect(btn).toHaveAccessibleName(`Jump to photo ${i + 1}`)
    })
  })
})
