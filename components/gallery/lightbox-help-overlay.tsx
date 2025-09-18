"use client"

import { AnimatePresence, motion } from 'framer-motion'

interface LightboxHelpOverlayProps {
  open: boolean
  onClose: () => void
}

const KEYBOARD_SHORTCUTS = [
  { keys: '← / A', description: 'Previous photo' },
  { keys: '→ / D', description: 'Next photo' },
  { keys: 'Esc', description: 'Close viewer' },
  { keys: 'H / ?', description: 'Toggle help' },
  { keys: '+ / =', description: 'Zoom in' },
  { keys: '- / _', description: 'Zoom out' },
  { keys: 'Double click', description: 'Toggle zoom' },
  { keys: 'Drag', description: 'Pan while zoomed' },
]

const TOUCH_GESTURES = [
  { gesture: 'Pinch', description: 'Zoom in/out' },
  { gesture: 'Double tap', description: 'Toggle zoom' },
  { gesture: 'One-finger drag', description: 'Pan when zoomed' },
  { gesture: 'Two-finger swipe', description: 'Switch photo (next/prev)' },
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
                <h3 className="text-lg font-semibold">Viewer Shortcuts</h3>
                <p className="text-xs text-white/60">Press Esc or click outside to return</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="self-start rounded-full border border-white/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70 transition hover:text-white"
              >
                Close
              </button>
            </header>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">Keyboard</h4>
              <ul className="grid gap-3 text-sm sm:grid-cols-2">
                {KEYBOARD_SHORTCUTS.map(item => (
                  <li key={item.keys} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3">
                    <kbd className="min-w-[72px] rounded-lg bg-black/40 px-3 py-1 text-center text-xs font-semibold uppercase tracking-wide text-white">
                      {item.keys}
                    </kbd>
                    <span className="text-white/80">{item.description}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-3">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">Touch & Trackpad</h4>
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
