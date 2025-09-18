## UI Enhancement Roadmap

### Completed
- Global theming & motion baseline (theme toggle, background optics, glass/blur tokens).
- Masonry gallery virtualization with lightbox compatibility.
- Semantic search console on public gallery page.
- Lightbox deep dive delivery:
  - Metadata side panel (`LightboxMetadata`) with collapsible EXIF/location/tag sections + keyboard focus safeguards.
  - Filmstrip navigation windowing (≤80 thumbs), auto-scroll, gradient affordances, wheel gestures.
  - Help overlay (`LightboxHelpOverlay`) replacing inline list with animated shortcut grid + touch/trackpad gesture guide.
  - `photo-modal.tsx` refactor around viewer / metadata / tags modules and shared lightbox context.
- Quick tag ergonomics: inline suggestions based on session usage (`LightboxTagsPanel`) and one-tap add flow.
- Masonry gallery accessibility: keyboard focus states, Enter/Space activation, reduced-motion awareness.

### Future Ideas
- Lightbox favourites/share activity.
- AI captions & auto tags.
- Offline-first caching for recent photos.

### Notes
- Each step should finish with `npm run type-check` & manual dark/light QA.
- Tag further tasks with `// TODO(lightbox)` for traceability.
