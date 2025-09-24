import { useCallback, useMemo, useState } from 'react'
import { Loader2, Plus, Tag as TagIcon } from 'lucide-react'
import { photoTagsStore } from './photo-tags-store'

export interface PanelTag {
  id: string
  name: string
  color?: string | null
}

interface LightboxTagsPanelProps {
  photoTitle: string
  tags: PanelTag[]
  editing: boolean
  toggleEditing: () => void
  addTag: (name: string) => Promise<void> | void
  removeTag: (id: string) => Promise<void> | void
  collapsed: boolean
  onToggle: () => void
}

export function LightboxTagsPanel({
  photoTitle,
  tags,
  editing,
  toggleEditing,
  addTag,
  removeTag,
  collapsed,
  onToggle,
}: LightboxTagsPanelProps) {
  // TODO(lightbox): surface tag suggestions based on user history.
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const pendingCount = useMemo(
    () => tags.filter(tag => tag.id.startsWith('temp-')).length,
    [tags]
  )

  const suggestions = useMemo(() => {
    const exclude = tags.map(tag => tag.name.toLowerCase())
    return photoTagsStore.getTopTags(6, exclude)
  }, [tags])

  const submitTag = useCallback(async (name: string, cleanup?: () => void) => {
    const trimmed = name.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      await addTag(trimmed)
      cleanup?.()
    } finally {
      setSubmitting(false)
    }
  }, [addTag, submitting])

  const handleSubmit = useCallback(() => {
    submitTag(draft, () => setDraft(''))
  }, [draft, submitTag])

  const handleRemove = useCallback(async (id: string) => {
    if (removingId) return
    setRemovingId(id)
    try {
      await removeTag(id)
    } finally {
      setRemovingId(current => (current === id ? null : current))
    }
  }, [removeTag, removingId])

  const handleQuickAdd = useCallback((name: string) => {
    submitTag(name)
  }, [submitTag])

  const activeTags = useMemo(() => tags.filter(tag => !tag.id.startsWith('temp-')), [tags])

  const titleText = `“${photoTitle}” 的标签`
  const countText = `${tags.length} 个`

  return (
    <article className="w-full max-w-3xl rounded-2xl border border-contrast-outline/10 bg-surface-panel/5 p-5 text-text-inverted shadow-soft backdrop-blur-xl">
      <header className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-2 text-left text-sm font-semibold text-text-inverted transition hover:text-text-inverted/70"
          aria-expanded={!collapsed}
        >
          <TagIcon className="h-4 w-4" />
          <span>{titleText}</span>
          <span className="text-xs text-text-inverted/60">{countText}</span>
        </button>
        <button
          type="button"
          onClick={toggleEditing}
          className="rounded-full border border-contrast-outline/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-inverted/70 transition hover:text-text-inverted"
        >
          {editing ? '完成' : '编辑'}
        </button>
      </header>

      {!collapsed && (
        <div className="mt-4 space-y-4 text-sm">
          <p className="text-xs text-text-inverted/60">
            为照片添加标签，方便检索。待保存：{pendingCount}
          </p>

          <div className="flex flex-wrap gap-2">
            {tags.length === 0 && (
              <span className="rounded-full border border-dashed border-contrast-outline/30 px-3 py-1 text-xs text-text-inverted/60">
                暂无标签
              </span>
            )}

            {tags.map(tag => {
              const pending = tag.id.startsWith('temp-')
              const isRemoving = removingId === tag.id
              return (
                <span
                  key={tag.id}
                  className={`group relative flex items-center gap-2 rounded-full px-3 py-1 text-xs ${
                    pending
                      ? 'bg-surface-panel/20 text-text-inverted/70'
                      : 'bg-surface-panel/10 text-text-inverted'
                  }`}
                >
                  <span>{tag.name}</span>
                  {pending && (
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                  )}
                  {editing && !pending && (
                    <button
                      type="button"
                      className="opacity-0 transition group-hover:opacity-100"
                      onClick={() => handleRemove(tag.id)}
                      aria-label={`移除标签 ${tag.name}`}
                    >
                      {isRemoving ? (
                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                      ) : (
                        <span className="text-[10px] font-bold">×</span>
                      )}
                    </button>
                  )}
                </span>
              )
            })}
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-text-inverted/60">推荐标签</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map(tag => (
                  <button
                    key={`${tag.id || tag.name}-suggestion`}
                    type="button"
                    className="rounded-full border border-contrast-outline/30 px-3 py-1 text-xs text-text-inverted/80 transition hover:border-contrast-outline hover:text-text-inverted disabled:opacity-50"
                    onClick={() => handleQuickAdd(tag.name)}
                    disabled={submitting}
                    aria-label={`添加标签 ${tag.name}`}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {editing && (
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={event => {
                event.preventDefault()
                handleSubmit()
              }}
            >
              <div className="flex items-center gap-2 rounded-full border border-contrast-outline/20 bg-contrast-surface/20 px-3 py-1">
                <Plus className="h-4 w-4 text-text-inverted/60" />
                <input
                  value={draft}
                  onChange={event => setDraft(event.target.value)}
                  placeholder="添加标签"
                  className="bg-transparent text-xs text-text-inverted placeholder:text-text-inverted/40 focus:outline-none"
                  disabled={submitting}
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-surface-panel/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-text-inverted transition hover:bg-surface-panel/30 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting || !draft.trim()}
              >
                {submitting ? '正在添加…' : '添加'}
              </button>
            </form>
          )}

          {activeTags.length > 0 && !editing && (
            <p className="text-xs text-text-inverted/60">
              提示：点击“编辑”可以重命名或移除标签。
            </p>
          )}
        </div>
      )}
    </article>
  )
}
