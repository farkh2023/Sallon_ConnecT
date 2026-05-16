'use client';

import { useEffect, useRef } from 'react';

export function usePolling(callback: () => void, intervalMs: number, enabled = true): void {
  const cbRef = useRef(callback);

  useEffect(() => {
    cbRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;
    const id = setInterval(() => cbRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
}
