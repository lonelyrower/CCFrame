import { render, screen, fireEvent } from '@testing-library/react'
import { LightboxHelpOverlay } from '@/components/gallery/lightbox-help-overlay'

describe('LightboxHelpOverlay', () => {
  it('renders shortcut list when open', () => {
    render(<LightboxHelpOverlay open onClose={() => {}} />)

    expect(screen.getByText('查看快捷键')).toBeInTheDocument()
    expect(screen.getByText('上一张照片')).toBeInTheDocument()
    expect(screen.getByText('下一张照片')).toBeInTheDocument()
    expect(screen.getByText('触摸 & 触控板')).toBeInTheDocument()
    expect(screen.getByText('双指捏合')).toBeInTheDocument()
  })

  it('invokes onClose when close button clicked', () => {
    const onClose = jest.fn()
    render(<LightboxHelpOverlay open onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: '关闭' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
