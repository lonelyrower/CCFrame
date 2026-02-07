'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useIsOnline } from '@/lib/hooks/useIsOnline';

type BannerMode = 'offline' | 'restored';

export function NetworkStatusBanner() {
  const isOnline = useIsOnline();
  const [showRestored, setShowRestored] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      setShowRestored(false);
      return;
    }

    if (!wasOfflineRef.current) return;

    wasOfflineRef.current = false;
    setShowRestored(true);
    const timer = window.setTimeout(() => setShowRestored(false), 2200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isOnline]);

  const shouldShow = !isOnline || showRestored;

  useEffect(() => {
    if (shouldShow) {
      setRendered(true);
      requestAnimationFrame(() => setVisible(true));
      return;
    }

    setVisible(false);
    const timer = window.setTimeout(() => setRendered(false), 220);

    return () => {
      window.clearTimeout(timer);
    };
  }, [shouldShow]);

  const mode: BannerMode = useMemo(() => (!isOnline ? 'offline' : 'restored'), [isOnline]);

  if (!rendered) return null;

  const ui =
    mode === 'offline'
      ? {
          dot: 'bg-[color:var(--ds-accent)]',
          ring: 'ring-[color:var(--ds-accent-30)]',
          bg: 'bg-black/70',
          title: '离线模式',
          desc: '可继续浏览已缓存内容',
          action: '重试',
        }
      : {
          dot: 'bg-emerald-400',
          ring: 'ring-emerald-400/25',
          bg: 'bg-black/55',
          title: '已恢复连接',
          desc: '内容将自动刷新更新',
          action: null,
        };

  return (
    <div
      className={`fixed left-0 right-0 z-[90] flex justify-center px-4 transition-all duration-200 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } bottom-[calc(4.25rem+env(safe-area-inset-bottom)+0.75rem)] md:bottom-6`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`pointer-events-auto w-full max-w-sm rounded-2xl ${ui.bg} text-white backdrop-blur-xl ring-1 ${ui.ring} shadow-2xl`}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <span className={`h-2.5 w-2.5 rounded-full ${ui.dot} ${mode === 'offline' ? 'animate-pulse' : ''}`} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium tracking-tight">{ui.title}</div>
            <div className="text-xs text-white/70">{ui.desc}</div>
          </div>
          {ui.action && (
            <button
              type="button"
              className="touch-manipulation rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/15 active:bg-white/20"
              onClick={() => window.location.reload()}
            >
              {ui.action}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
