'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { getStoredWorkspaceId, WORKSPACE_CHANGED_EVENT } from '@/lib/workspaceStorage';
import type {
  KnowledgeItem, KnowledgeMeta, KnowledgeSafetyFlags,
  KnowledgeSearchResponse, KnowledgeGraphResponse,
  KnowledgeSummaryResponse, KnowledgeCategorySummary,
} from '@/lib/types';

interface KnowledgeFilters {
  type?:   string;
  source?: string;
  tag?:    string;
  entity?: string;
}

interface UseKnowledgeReturn {
  items:      KnowledgeItem[];
  meta:       KnowledgeMeta | null;
  safety:     KnowledgeSafetyFlags | null;
  loading:    boolean;
  error:      string | null;
  enabled:    boolean;
  workspaceId: string;
  loadItems:  (filters?: KnowledgeFilters) => Promise<void>;
  search:     (query: string, filters?: KnowledgeFilters, topK?: number) => Promise<KnowledgeItem[]>;
  getGraph:   (filters?: KnowledgeFilters) => Promise<KnowledgeGraphResponse | null>;
  summarize:  (category?: string) => Promise<KnowledgeSummaryResponse | KnowledgeCategorySummary | null>;
  reindex:    () => Promise<boolean>;
  clearAll:   () => Promise<boolean>;
}

export function useKnowledge(): UseKnowledgeReturn {
  const [items,   setItems]   = useState<KnowledgeItem[]>([]);
  const [meta,    setMeta]    = useState<KnowledgeMeta | null>(null);
  const [safety,  setSafety]  = useState<KnowledgeSafetyFlags | null>(null);
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

  const loadItems = useCallback(async (filters: KnowledgeFilters = {}) => {
    if (!mounted.current) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.type)   params.set('type',   filters.type);
      if (filters.source) params.set('source', filters.source);
      if (filters.tag)    params.set('tag',    filters.tag);
      if (filters.entity) params.set('entity', filters.entity);
      const qs  = params.toString();
      const res = await apiGet<{ items: KnowledgeItem[]; meta: KnowledgeMeta; safety: KnowledgeSafetyFlags }>(`/api/ai/knowledge${qs ? `?${qs}` : ''}`);
      if (mounted.current) {
        setItems(res.items || []);
        setMeta(res.meta   || null);
        setSafety(res.safety || null);
      }
      const status = await apiGet<{ enabled: boolean }>('/api/ai/knowledge/status');
      if (mounted.current) setEnabled(status.enabled ?? false);
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Erreur knowledge');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial
  useEffect(() => { void loadItems(); }, [loadItems, workspaceId]);

  const search = useCallback(async (query: string, filters: KnowledgeFilters = {}, topK = 8): Promise<KnowledgeItem[]> => {
    try {
      const res = await apiPost<KnowledgeSearchResponse>('/api/ai/knowledge/search', { query, filters, topK });
      return res.results || [];
    } catch { return []; }
  }, []);

  const getGraph = useCallback(async (filters: KnowledgeFilters = {}): Promise<KnowledgeGraphResponse | null> => {
    try {
      return await apiPost<KnowledgeGraphResponse>('/api/ai/knowledge/graph', { filters });
    } catch { return null; }
  }, []);

  const summarize = useCallback(async (category?: string) => {
    try {
      return await apiPost<KnowledgeSummaryResponse | KnowledgeCategorySummary>('/api/ai/knowledge/summarize', category ? { category } : {});
    } catch { return null; }
  }, []);

  const reindex = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      await apiPost('/api/ai/knowledge/reindex', {});
      await loadItems();
      return true;
    } catch { return false; }
    finally { setLoading(false); }
  }, [loadItems]);

  const clearAll = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await apiPost('/api/ai/knowledge/clear', { confirmation: 'EFFACER_KNOWLEDGE_BASE' });
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
    loadItems, search, getGraph, summarize, reindex, clearAll,
  };
}
