import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LightboxTagsPanel, type PanelTag } from '@/components/gallery/lightbox-tags-panel'
import { photoTagsStore } from '@/components/gallery/photo-tags-store'

const baseProps = {
  photoTitle: 'Sunset',
  editing: false,
  toggleEditing: jest.fn(),
  addTag: jest.fn().mockResolvedValue(undefined),
  removeTag: jest.fn().mockResolvedValue(undefined),
  collapsed: false,
  onToggle: jest.fn(),
}

const tags: PanelTag[] = [
  { id: '1', name: 'Nature' },
  { id: '2', name: 'Evening' },
]

describe('LightboxTagsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    photoTagsStore.clear()
  })

  it('renders existing tags', () => {
    render(<LightboxTagsPanel {...baseProps} tags={tags} />)

    expect(screen.getByText('“Sunset” 的标签')).toBeInTheDocument()
    expect(screen.getByText('Nature')).toBeInTheDocument()
    expect(screen.getByText('Evening')).toBeInTheDocument()
  })

  it('calls toggleEditing when edit button pressed', () => {
    render(<LightboxTagsPanel {...baseProps} tags={tags} />)

    fireEvent.click(screen.getByRole('button', { name: '编辑' }))

    expect(baseProps.toggleEditing).toHaveBeenCalledTimes(1)
  })

  it('submits new tag value when editing enabled', async () => {
    render(<LightboxTagsPanel {...baseProps} editing tags={tags} />)

    const input = screen.getByPlaceholderText('添加标签')
    fireEvent.change(input, { target: { value: 'Golden hour' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => {
      expect(baseProps.addTag).toHaveBeenCalledWith('Golden hour')
    })
  })

  it('shows suggestions and allows quick add', async () => {
    photoTagsStore.set('other-photo', [
      { id: 's1', name: 'Golden hour' },
      { id: 's2', name: 'Nature' },
    ])

    render(<LightboxTagsPanel {...baseProps} tags={tags} />)

    expect(screen.getByText('推荐标签')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '添加标签 Golden hour' }))

    await waitFor(() => {
      expect(baseProps.addTag).toHaveBeenCalledWith('Golden hour')
    })
  })
})
