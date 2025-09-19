"use client"

import { AnimatePresence, motion } from 'framer-motion'

interface LightboxHelpOverlayProps {
  open: boolean
  onClose: () => void
}

const KEYBOARD_SHORTCUTS = [
  { keys: '方向键左 / A', description: '上一张照片' },
  { keys: '方向键右 / D', description: '下一张照片' },
  { keys: 'Esc', description: '关闭预览' },
  { keys: 'H / ?', description: '切换帮助' },
  { keys: '+ / =', description: '放大' },
  { keys: '- / _', description: '缩小' },
  { keys: 'Double click', description: '双击切换缩放' },
  { keys: 'Drag', description: '拖拽浏览' },
]

const TOUCH_GESTURES = [
  { gesture: '双指捏合', description: '放大或缩小' },
  { gesture: '双击', description: '双击切换缩放' },
  { gesture: '单指拖拽', description: '拖拽查看缩放状态' },
  { gesture: '双指滑动', description: '切换上一/下一张' },
]

export function LightboxHelpOverlay({ open, onClose }: LightboxHelpOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 px-6 py-8 text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={event => {
            event.stopPropagation()
            onClose()
          }}
        >
          <motion.div
            className="w-full max-w-3xl space-y-8 rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={event => event.stopPropagation()}
          >
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">查看快捷键</h3>
                <p className="text-xs text-white/60">按下 ? 或点击空白区退出</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="self-start rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:text-white"
              >
                关闭
              </button>
            </header>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">键盘</h4>
              <ul className="grid gap-3 text-sm sm:grid-cols-2">
                {KEYBOARD_SHORTCUTS.map(item => (
                  <li key={item.keys} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                    <kbd className="min-w-[96px] rounded-lg bg-black/40 px-3 py-1 text-center text-xs font-semibold uppercase tracking-wide text-white">
                      {item.keys}
                    </kbd>
                    <span className="text-white/80">{item.description}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">触摸 & 触控板</h4>
              <ul className="grid gap-3 text-sm sm:grid-cols-2">
                {TOUCH_GESTURES.map(item => (
                  <li key={item.gesture} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                    <span className="min-w-[120px] rounded-lg bg-black/30 px-3 py-1 text-center text-xs font-semibold uppercase tracking-wide text-white">
                      {item.gesture}
                    </span>
                    <span className="text-white/80">{item.description}</span>
                  </li>
                ))}
              </ul>
            </section>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}


