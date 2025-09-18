# CCFrame Architecture & Conventions

## Domain States & Constants
All previously scattered string literals for status / visibility have been centralized in `lib/constants.ts`:

- VISIBILITY: PUBLIC | PRIVATE
- PHOTO_STATUS: UPLOADING | PROCESSING | COMPLETED | FAILED
- JOB_STATUS: PENDING | RUNNING | COMPLETED | FAILED
- JOB_TYPE: THUMBNAIL_GENERATION | EXIF_EXTRACTION | VARIANT_GENERATION | HASH_COMPUTATION | FACE_DETECTION

Use these imports instead of raw strings to avoid typos and enable refactors.

## Photo Processing Pipeline
1. Upload original → create Photo (status=UPLOADING)
2. Worker picks job → set status=PROCESSING
3. Generate variants (sharp) honoring dynamic settings (AppSettings.imageFormats / imageVariantNames)
4. Compute blurhash, perceptual hash, content hash
5. Extract EXIF (if any) and set takenAt/location fallback logic
6. Persist variants + update Photo (status=COMPLETED)

Fast duplicate path:
1. 前端可在预签阶段发送 contentHash（本地计算 sha256）
2. API 在 `presign` 中使用 `checkDuplicatePhoto()` 若已存在则直接返回 `completed:true, duplicate:true`，无需再上传
3. Worker 二次保险：若仍上传了重复文件，再次检测并复用已存在的 variants（删除冗余原图）

## De-duplication Strategy

Database-level guarantee prevents storing duplicate binary photos per user:

```prisma
// In model Photo
@@unique([userId, contentHash])
```

Because `contentHash` is nullable, multiple NULLs are allowed (PostgreSQL semantics). The flow:

1. Browser computes incremental SHA-256 while reading file (streamed hashing).
2. `/api/upload/presign` receives `contentHash` and uses `checkDuplicatePhoto()`.
3. If existing, returns `{ duplicate: true, completed: true, photoId }` (no upload performed).
4. Worker re-checks as safety (race or missing hash) and reuses variants, discarding duplicate original.

## Photo Detail / Lightbox UX

Modular Lightbox system components:

- `LightboxProvider` / `useLightbox`: list navigation & open/close state + keyboard shortcuts.
- `PhotoZoomCanvas`: zoom (wheel ± / double click toggle 1x↔2x) + pan (drag) + pinch (multi-touch midpoint anchoring) up to 5x; shows percentage; Blurhash or thumb fallback + dominant color gradient placeholder fades to final image.
- Keyboard '+' / '-' dispatch a custom DOM event:

```ts
document.dispatchEvent(new CustomEvent('lightbox-zoom', { detail: { delta: 0.2 } }))
```

`PhotoZoomCanvas` listens for `lightbox-zoom` to adjust scale (clamped 1–5). When returning to 1x, pan offset resets to (0,0).
- `PhotoFilmstrip`: bottom thumbnail strip for rapid navigation & context (preloads neighbors).
- `usePrefetchPhotos`: eager loads previous/next large variant.
- Help overlay: press `?` to show shortcuts (A/← prev, D/→ next, Esc close, +/- zoom, double-click toggle, drag pan).

Additional Implemented UX:
- Collapsible metadata sections (EXIF / Tags / Technical Info)
- Inline tag editing with optimistic add/remove (temporary tag id reconciliation + rollback on failure)
- Simple canvas map preview (equirect projection) for photos with lat/lng
- Base accessibility: dialog role & aria-modal, keyboard shortcuts, focusable info panel, roving tabindex + ARIA listbox for filmstrip, focus trap & Tab loop

Planned Enhancements:
- SWR / cache layer integration for tag mutations (current is local-only optimistic)
- Improved pinch inertia & momentum

`contentHash = sha256(originalBuffer)` ensures exact binary duplicate detection.

Helper: `lib/photo-dedupe.ts`
`checkDuplicatePhoto(userId, contentHash)` → returns existing photo id if present.

Future extension ideas:
- Cross-user duplicate detection with optional global hash index
- Variant sharing table (避免复制 variant 行)
- UI duplicate badge + 合并操作
- 相似度分组（基于 pHash）

## Smart Albums
Rules (JSON) translated via `buildPhotoWhereFromRule` combining tag inclusion/exclusion, visibility filtering, and date range precedence (takenAt over createdAt).

## Storage Fallback
`getStorageManager()` chooses provider (MinIO/AWS/Aliyun/QCloud) or local fallback in dev when misconfigured, minimizing setup friction.

## Testing
Added Jest tests:
- `image-processing.test.ts`: variant filtering, blurhash, hash determinism
- `smart-albums.test.ts`: rule translation cases
- `storage-manager.test.ts`: dev fallback behavior

Run: `npm test`

## Removed Editing Feature
Legacy editing (EditVersion) was removed; empty placeholder directories (`app/admin/basic-editor`, `app/api/edit/*`) remain for potential future reintroduction.
They can be deleted entirely if no longer desired.

## Tags

- Data model: many-to-many via `PhotoTag` join.
- Endpoints:
	- `POST /api/photos/:photoId/tags` body `{ name?: string; tagId?: string }` attach existing or create+attach. Returns `{ tag }`.
	- `DELETE /api/photos/:photoId/tags/:tagId` detach association (idempotent style).
- Optimistic UI: local temporary tag inserted (`id = temp-*`) then reconciled with server response; rollback + toast on failure.
- Future: keyboard quick-add palette, usage frequency weighting, color inference.
 - In-memory store: `photoTagsStore` provides ephemeral cross-component sync (subscribe/notify). `usePhotoTags` hydrates from store or initial props and publishes updates so multiple open viewers (or side panels) stay consistent without a global state library.
 - Duplicate prevention: `usePhotoTags` blocks adding a tag whose name (case-insensitive) already exists and surfaces a toast.
 - Pending state: temp tags (id starts with `temp-`) rendered with pulse style + spinner until server confirmation.
 - Abortable mutations: each add/remove aborts any in-flight tag mutation using `AbortController` to avoid race conditions.

## Accessibility Additions

- Filmstrip options expose `aria-posinset` and `aria-setsize` for screen reader positional context.
- Tag remove buttons have explicit `aria-label`.
- Dialog maintains manual focus trap; future improvement may consolidate into reusable hook.
- Reusable Hooks: `useFocusTrap(ref, active, { initialFocus, returnFocus })` centralizes focus containment + controlled entry/exit focus management; `usePhotoTags(photoId, initial)` encapsulates optimistic tag CRUD + store integration.
 - Focus return: gallery opener elements marked with `data-lightbox-return` regain focus after modal unmount (via `returnFocus`).

## Next Steps (Suggested)
- Add tests for storage fallback & smart album queries
- Implement duplicate variant reuse (symbolic or logical linking)
- Migrate from `prisma db push` to migration history
- Add rate limiting to auth & upload endpoints
- Optional: face search & clustering
