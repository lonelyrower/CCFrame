import { render, screen, fireEvent } from '@testing-library/react'
import { LightboxHelpOverlay } from '@/components/gallery/lightbox-help-overlay'

describe('LightboxHelpOverlay', () => {
  it('renders shortcut list when open', () => {
    render(<LightboxHelpOverlay open onClose={() => {}} />)

    expect(screen.getByText('Viewer Shortcuts')).toBeInTheDocument()
    expect(screen.getByText('Previous photo')).toBeInTheDocument()
    expect(screen.getByText('Next photo')).toBeInTheDocument()
    expect(screen.getByText('Touch & Trackpad')).toBeInTheDocument()
    expect(screen.getByText('Pinch')).toBeInTheDocument()
  })

  it('invokes onClose when close button clicked', () => {
    const onClose = jest.fn()
    render(<LightboxHelpOverlay open onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: /close/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
