'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiGet, handleApiError } from '@/lib/api';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useApi<T>(path: string, immediate = true): UseApiState<T> {
  const [data, setData]       = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const mountedRef            = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet<T>(path);
      if (mountedRef.current) setData(result);
    } catch (err) {
      if (mountedRef.current) setError(handleApiError(err));
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    if (!immediate || typeof window === 'undefined') return;
    const id = window.setTimeout(() => {
      void fetch();
    }, 0);
    return () => window.clearTimeout(id);
  }, [fetch, immediate]);

  return { data, loading, error, refresh: fetch };
}
