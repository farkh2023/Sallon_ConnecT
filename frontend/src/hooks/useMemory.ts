'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';
import { getStoredWorkspaceId, WORKSPACE_CHANGED_EVENT } from '@/lib/workspaceStorage';
import type {
  MemoryItem, MemoryMeta, MemorySafetyFlags,
  MemorySearchResponse, MemorySummaryResponse,
} from '@/lib/types';

interface MemoryFilters {
  type?:   string;
  scope?:  string;
  source?: string;
  tags?:   string;
}

interface UseMemoryReturn {
  items:       MemoryItem[];
  meta:        MemoryMeta | null;
  safety:      MemorySafetyFlags | null;
  loading:     boolean;
  error:       string | null;
  enabled:     boolean;
  workspaceId: string;
  loadItems:   (filters?: MemoryFilters) => Promise<void>;
  createItem:  (item: Partial<MemoryItem>) => Promise<boolean>;
  updateItem:  (id: string, item: Partial<MemoryItem>) => Promise<boolean>;
  deleteItem:  (id: string) => Promise<boolean>;
  search:      (query: string, filters?: MemoryFilters, topK?: number) => Promise<MemoryItem[]>;
  summarize:   (ids?: string[]) => Promise<MemorySummaryResponse | null>;
  exportAll:   () => Promise<string | null>;
  clearAll:    () => Promise<boolean>;
}

export function useMemory(): UseMemoryReturn {
  const [items,   setItems]   = useState<MemoryItem[]>([]);
  const [meta,    setMeta]    = useState<MemoryMeta | null>(null);
  const [safety,  setSafety]  = useState<MemorySafetyFlags | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [workspaceId, setWorkspaceId] = useState(getStoredWorkspaceId);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const handleWorkspaceChange = () => {
      setWorkspaceId(getStoredWorkspaceId());
      setItems([]);
      setMeta(null);
      setError(null);
    };
    window.addEventListener(WORKSPACE_CHANGED_EVENT, handleWorkspaceChange);
    window.addEventListener('storage', handleWorkspaceChange);
    return () => {
      window.removeEventListener(WORKSPACE_CHANGED_EVENT, handleWorkspaceChange);
      window.removeEventListener('storage', handleWorkspaceChange);
    };
  }, []);

  const loadItems = useCallback(async (filters: MemoryFilters = {}) => {
    if (!mounted.current) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.type)   params.set('type',   filters.type);
      if (filters.scope)  params.set('scope',  filters.scope);
      if (filters.source) params.set('source', filters.source);
      if (filters.tags)   params.set('tags',   filters.tags);

      const qs  = params.toString();
      const res = await apiGet<{ items: MemoryItem[]; meta: MemoryMeta; safety: MemorySafetyFlags }>(`/api/ai/memory${qs ? `?${qs}` : ''}`);
      if (mounted.current) {
        setItems(res.items || []);
        setMeta(res.meta   || null);
        setSafety(res.safety || null);
      }

      // Check enabled status
      const status = await apiGet<{ enabled: boolean }>('/api/ai/memory/status');
      if (mounted.current) setEnabled(status.enabled ?? false);
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Erreur mémoire');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial
  useEffect(() => { void loadItems(); }, [loadItems, workspaceId]);

  const createItem = useCallback(async (item: Partial<MemoryItem>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiPost('/api/ai/memory', item);
      await loadItems();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur création');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  const updateItem = useCallback(async (id: string, item: Partial<MemoryItem>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiPatch(`/api/ai/memory/${id}`, item);
      await loadItems();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur mise à jour');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiDelete(`/api/ai/memory/${id}`);
      await loadItems();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur suppression');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  const search = useCallback(async (query: string, filters: MemoryFilters = {}, topK = 10): Promise<MemoryItem[]> => {
    try {
      const res = await apiPost<MemorySearchResponse>('/api/ai/memory/search', { query, filters, topK });
      return res.results || [];
    } catch { return []; }
  }, []);

  const summarize = useCallback(async (ids?: string[]): Promise<MemorySummaryResponse | null> => {
    try {
      return await apiPost<MemorySummaryResponse>('/api/ai/memory/summarize', ids ? { ids } : {});
    } catch { return null; }
  }, []);

  const exportAll = useCallback(async (): Promise<string | null> => {
    try {
      const res = await apiPost<{ filename: string; totalItems: number }>('/api/ai/memory/export', {});
      return res.filename || null;
    } catch { return null; }
  }, []);

  const clearAll = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiPost('/api/ai/memory/clear', { confirmation: 'EFFACER_MEMOIRE' });
      await loadItems();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur effacement');
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadItems]);

  return {
    items, meta, safety, loading, error, enabled, workspaceId,
    loadItems, createItem, updateItem, deleteItem,
    search, summarize, exportAll, clearAll,
  };
}
