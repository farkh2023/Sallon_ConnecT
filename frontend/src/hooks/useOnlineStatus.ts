'use client';

import { useEffect, useState } from 'react';

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sync = () => setOnline(window.navigator.onLine);
    sync();

    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);

    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  return online;
}
