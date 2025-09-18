import { useEffect } from 'react'

interface FocusTrapOptions {
  initialFocus?: () => HTMLElement | null
  returnFocus?: () => HTMLElement | null
}

// Simple focus trap: keep Tab focus cycling within the given root element.
export function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active: boolean, opts: FocusTrapOptions = {}) {
  useEffect(() => {
    if (!active) return
    const root = ref.current
    if (!root) return
    const prevFocused = document.activeElement as HTMLElement | null
    // initial focus
    const target = opts.initialFocus?.() || root.querySelector<HTMLElement>(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    )
    target?.focus()
    function onKey(e: KeyboardEvent) {
      if (!ref.current) return
      if (e.key !== 'Tab') return
      const scope = ref.current
      const focusables = scope!.querySelectorAll<HTMLElement>(
        'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault(); (last as HTMLElement).focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault(); (first as HTMLElement).focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      const rf = opts.returnFocus?.() || prevFocused
      rf?.focus?.()
    }
  }, [ref, active, opts])
}