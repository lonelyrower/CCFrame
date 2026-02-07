'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    const enableInDev = process.env.NEXT_PUBLIC_SW_DEV === 'true';
    if (process.env.NODE_ENV !== 'production' && !enableInDev) return;
    if (!('serviceWorker' in navigator)) return;

    const registerServiceWorker = () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((error) => console.error('Service worker registration failed:', error));
    };

    if (document.readyState === 'complete') {
      registerServiceWorker();
    } else {
      window.addEventListener('load', registerServiceWorker, { once: true });
    }
  }, []);

  return null;
}
