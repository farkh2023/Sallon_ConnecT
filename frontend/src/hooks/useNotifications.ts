'use client';

import { useState, useCallback, useEffect } from 'react';
import { apiGet, apiPatch, handleApiError } from '@/lib/api';
import type { NotificationItem, NotificationStats } from '@/lib/types';
import { usePolling } from './usePolling';

export function useNotifications(pollMs = 15000) {
  const [items, setItems]   = useState<NotificationItem[]>([]);
  const [stats, setStats]   = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, st] = await Promise.all([
        apiGet<{ notifications: NotificationItem[] }>('/api/notifications?limit=50'),
        apiGet<NotificationStats>('/api/notifications/stats'),
      ]);
      setItems(list.notifications ?? []);
      setStats(st);
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(id);
  }, [load]);
  usePolling(load, pollMs, true);

  const markRead = useCallback(async (id: string) => {
    try {
      await apiPatch(`/api/notifications/${id}/read`);
      setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setStats(prev => prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : prev);
    } catch { /* ignore */ }
  }, []);

  return { items, stats, loading, error, refresh: load, markRead };
}
