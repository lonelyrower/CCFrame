import type { PhotoWithDetails } from '@/types'
import type { StorySequence } from '@/types/lightbox'
import { findEntryIndex } from '@/lib/lightbox/story-service'

export type LightboxMode = 'lightbox' | 'story'

export interface LightboxViewportState {
  zoom: number
  offsetX: number
  offsetY: number
}

export interface LightboxState {
  photos: PhotoWithDetails[]
  index: number
  isOpen: boolean
  helpOpen: boolean
  showInfoStack: boolean
  showFilmstrip: boolean
  mode: LightboxMode
  viewport: LightboxViewportState
  storySequence: StorySequence | null
  storyIndex: number
}

export type LightboxAction =
  | { type: 'SET_PHOTOS'; photos: PhotoWithDetails[] }
  | { type: 'OPEN_BY_ID'; id: string }
  | { type: 'OPEN_BY_INDEX'; index: number }
  | { type: 'SET_INDEX'; index: number }
  | { type: 'GO'; index: number }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'CLOSE' }
  | { type: 'TOGGLE_HELP' }
  | { type: 'TOGGLE_INFO_STACK' }
  | { type: 'SET_INFO_STACK_VISIBILITY'; value: boolean }
  | { type: 'SET_MODE'; mode: LightboxMode }
  | { type: 'SET_VIEWPORT'; viewport: Partial<LightboxViewportState> }
  | { type: 'RESET_VIEWPORT' }
  | { type: 'SET_FILMSTRIP_VISIBILITY'; value: boolean }
  | { type: 'SET_STORY_SEQUENCE'; sequence: StorySequence | null }
  | { type: 'SET_STORY_INDEX'; index: number }
  | { type: 'NEXT_STORY' }
  | { type: 'PREV_STORY' }

function createViewport(): LightboxViewportState {
  return { zoom: 1, offsetX: 0, offsetY: 0 }
}

function clampIndex(photos: PhotoWithDetails[], index: number): number {
  if (photos.length === 0) return 0
  if (index < 0) return 0
  if (index >= photos.length) return photos.length - 1
  return index
}

function clampStoryIndex(sequence: StorySequence | null, index: number): number {
  if (!sequence || sequence.entries.length === 0) return 0
  if (index < 0) return 0
  if (index >= sequence.entries.length) return sequence.entries.length - 1
  return index
}

function photoIndexForEntry(photos: PhotoWithDetails[], entry: StorySequence['entries'][number] | undefined, fallback: number): number {
  if (!entry?.photoId) return fallback
  const matched = photos.findIndex((photo) => photo.id === entry.photoId)
  return matched >= 0 ? matched : fallback
}

function syncStoryIndexWithPhoto(state: LightboxState, photoId: string | null | undefined): number {
  if (!state.storySequence) return state.storyIndex
  const matched = findEntryIndex(state.storySequence, photoId)
  if (matched === -1) return state.storyIndex
  return clampStoryIndex(state.storySequence, matched)
}

export function createInitialLightboxState(photos: PhotoWithDetails[] = []): LightboxState {
  return {
    photos,
    index: 0,
    isOpen: false,
    helpOpen: false,
    showInfoStack: true,
    showFilmstrip: true,
    mode: 'lightbox',
    viewport: createViewport(),
    storySequence: null,
    storyIndex: 0,
  }
}

export function getCurrentPhoto(state: LightboxState): PhotoWithDetails | null {
  if (!state.photos.length) return null
  return state.photos[clampIndex(state.photos, state.index)] ?? null
}

export function lightboxReducer(state: LightboxState, action: LightboxAction): LightboxState {
  switch (action.type) {
    case 'SET_PHOTOS': {
      const nextPhotos = action.photos ?? []
      if (nextPhotos === state.photos) return state

      if (nextPhotos.length === 0) {
        return {
          ...state,
          photos: [],
          index: 0,
          isOpen: false,
          helpOpen: false,
          storyIndex: 0,
          storySequence: state.storySequence,
        }
      }

      const currentId = state.photos[state.index]?.id
      let nextIndex = state.index

      if (currentId) {
        const matched = nextPhotos.findIndex((photo) => photo.id === currentId)
        nextIndex = matched >= 0 ? matched : clampIndex(nextPhotos, state.index)
      } else {
        nextIndex = clampIndex(nextPhotos, state.index)
      }

      return {
        ...state,
        photos: nextPhotos,
        index: nextIndex,
        storyIndex: clampStoryIndex(state.storySequence, state.storyIndex),
      }
    }

    case 'OPEN_BY_ID': {
      if (!action.id) return state
      const index = state.photos.findIndex((photo) => photo.id === action.id)
      if (index === -1) return state
      return {
        ...state,
        index,
        isOpen: true,
        helpOpen: false,
        mode: 'lightbox',
        storyIndex: syncStoryIndexWithPhoto(state, state.photos[index]?.id),
        viewport: createViewport(),
      }
    }

    case 'OPEN_BY_INDEX': {
      const index = clampIndex(state.photos, action.index)
      if (state.photos.length === 0) return state
      return {
        ...state,
        index,
        isOpen: true,
        helpOpen: false,
        mode: 'lightbox',
        storyIndex: syncStoryIndexWithPhoto(state, state.photos[index]?.id),
        viewport: createViewport(),
      }
    }

    case 'SET_INDEX':
    case 'GO': {
      if (state.photos.length === 0) return state
      const index = clampIndex(state.photos, action.index)
      if (index === state.index) return state
      const nextPhoto = state.photos[index]
      return {
        ...state,
        index,
        storyIndex: syncStoryIndexWithPhoto(state, nextPhoto?.id),
      }
    }

    case 'NEXT': {
      if (state.photos.length === 0) return state
      const nextIndex = clampIndex(state.photos, state.index + 1)
      if (nextIndex === state.index) return state
      const nextPhoto = state.photos[nextIndex]
      return {
        ...state,
        index: nextIndex,
        storyIndex: syncStoryIndexWithPhoto(state, nextPhoto?.id),
      }
    }

    case 'PREV': {
      if (state.photos.length === 0) return state
      const nextIndex = clampIndex(state.photos, state.index - 1)
      if (nextIndex === state.index) return state
      const nextPhoto = state.photos[nextIndex]
      return {
        ...state,
        index: nextIndex,
        storyIndex: syncStoryIndexWithPhoto(state, nextPhoto?.id),
      }
    }

    case 'CLOSE':
      if (!state.isOpen && !state.helpOpen) return state
      return {
        ...state,
        isOpen: false,
        helpOpen: false,
        mode: 'lightbox',
      }

    case 'TOGGLE_HELP':
      return {
        ...state,
        helpOpen: !state.helpOpen,
      }

    case 'TOGGLE_INFO_STACK':
      return {
        ...state,
        showInfoStack: !state.showInfoStack,
      }

    case 'SET_INFO_STACK_VISIBILITY':
      if (state.showInfoStack === action.value) return state
      return {
        ...state,
        showInfoStack: action.value,
      }

    case 'SET_MODE':
      if (state.mode === action.mode) return state
      return {
        ...state,
        mode: action.mode,
      }

    case 'SET_VIEWPORT':
      return {
        ...state,
        viewport: {
          ...state.viewport,
          ...action.viewport,
        },
      }

    case 'RESET_VIEWPORT':
      return {
        ...state,
        viewport: createViewport(),
      }

    case 'SET_FILMSTRIP_VISIBILITY':
      if (state.showFilmstrip === action.value) return state
      return {
        ...state,
        showFilmstrip: action.value,
      }

    case 'SET_STORY_SEQUENCE': {
      const sequence = action.sequence
      if (!sequence || sequence.entries.length === 0) {
        return {
          ...state,
          storySequence: null,
          storyIndex: 0,
          mode: state.mode === 'story' ? 'lightbox' : state.mode,
        }
      }
      const currentPhotoId = state.photos[state.index]?.id ?? null
      let nextStoryIndex = findEntryIndex(sequence, currentPhotoId)
      if (nextStoryIndex === -1) nextStoryIndex = 0
      const entry = sequence.entries[clampStoryIndex(sequence, nextStoryIndex)]
      const index = photoIndexForEntry(state.photos, entry, state.index)
      return {
        ...state,
        storySequence: sequence,
        storyIndex: clampStoryIndex(sequence, nextStoryIndex),
        index,
      }
    }

    case 'SET_STORY_INDEX': {
      if (!state.storySequence) return state
      const storyIndex = clampStoryIndex(state.storySequence, action.index)
      if (storyIndex === state.storyIndex) return state
      const entry = state.storySequence.entries[storyIndex]
      const index = photoIndexForEntry(state.photos, entry, state.index)
      return {
        ...state,
        storyIndex,
        index,
      }
    }

    case 'NEXT_STORY': {
      if (!state.storySequence) return state
      const storyIndex = clampStoryIndex(state.storySequence, state.storyIndex + 1)
      if (storyIndex === state.storyIndex) return state
      const entry = state.storySequence.entries[storyIndex]
      const index = photoIndexForEntry(state.photos, entry, state.index)
      return {
        ...state,
        storyIndex,
        index,
      }
    }

    case 'PREV_STORY': {
      if (!state.storySequence) return state
      const storyIndex = clampStoryIndex(state.storySequence, state.storyIndex - 1)
      if (storyIndex === state.storyIndex) return state
      const entry = state.storySequence.entries[storyIndex]
      const index = photoIndexForEntry(state.photos, entry, state.index)
      return {
        ...state,
        storyIndex,
        index,
      }
    }

    default:
      return state
  }
}
