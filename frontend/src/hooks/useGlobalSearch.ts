'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { getStoredWorkspaceId, workspaceScopedKey } from '@/lib/workspaceStorage';
import type {
  SearchResult, SearchCommand, SearchResponse,
  SearchStatusResponse, CommandRunResponse, SearchHistoryEntry,
} from '@/lib/types';

const HISTORY_KEY = 'sallon_search_history';
const MAX_HISTORY = 50;

function loadHistory(workspaceId = getStoredWorkspaceId()): SearchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(workspaceScopedKey(HISTORY_KEY, workspaceId)) || '[]');
  } catch { return []; }
}

function saveHistory(entries: SearchHistoryEntry[], workspaceId = getStoredWorkspaceId()) {
  try {
    localStorage.setItem(workspaceScopedKey(HISTORY_KEY, workspaceId), JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {}
}

interface UseGlobalSearchReturn {
  results:        SearchResult[];
  groups:         Record<string, SearchResult[]>;
  commands:       SearchCommand[];
  history:        SearchHistoryEntry[];
  loading:        boolean;
  error:          string | null;
  enabled:        boolean;
  query:          string;
  setQuery:       (q: string) => void;
  search:         (q: string, filters?: Record<string, string>) => Promise<void>;
  loadCommands:   () => Promise<void>;
  previewCommand: (id: string) => Promise<SearchCommand | null>;
  runCommand:     (id: string, params?: Record<string, string>) => Promise<CommandRunResponse | null>;
  clearHistory:   () => void;
}

export function useGlobalSearch(): UseGlobalSearchReturn {
  const [results,  setResults]  = useState<SearchResult[]>([]);
  const [groups,   setGroups]   = useState<Record<string, SearchResult[]>>({});
  const [commands, setCommands] = useState<SearchCommand[]>([]);
  const [history,  setHistory]  = useState<SearchHistoryEntry[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [enabled,  setEnabled]  = useState(true);
  const [query,    setQuery]    = useState('');
  const [workspaceId, setWorkspaceId] = useState(getStoredWorkspaceId());
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    /* eslint-disable react-hooks/set-state-in-effect */
    const id = getStoredWorkspaceId();
    setWorkspaceId(id);
    setHistory(loadHistory(id));
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => { mounted.current = false; };
  }, []);

  const loadCommands = useCallback(async () => {
    try {
      const res = await apiGet<{ commands: SearchCommand[] }>('/api/search/commands');
      if (mounted.current) setCommands(res.commands || []);
    } catch {}
  }, []);

  const checkEnabled = useCallback(async () => {
    try {
      const res = await apiGet<SearchStatusResponse>('/api/search/status');
      if (mounted.current) setEnabled(res.enabled ?? true);
      if (mounted.current) {
        const id = getStoredWorkspaceId();
        setWorkspaceId(id);
        setHistory(loadHistory(id));
      }
    } catch {}
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    void checkEnabled();
    void loadCommands();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const search = useCallback(async (q: string, filters: Record<string, string> = {}) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<SearchResponse>('/api/search', { query: q, filters, topK: 10 });
      if (mounted.current) {
        setResults(res.results || []);
        setGroups(res.groups   || {});
        setHistory(prev => {
          const entry: SearchHistoryEntry = { query: q, timestamp: new Date().toISOString(), total: res.total };
          const updated = [entry, ...prev.filter(h => h.query !== q)].slice(0, MAX_HISTORY);
          saveHistory(updated, workspaceId);
          return updated;
        });
      }
    } catch (e) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Erreur recherche');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [workspaceId]);

  const previewCommand = useCallback(async (id: string): Promise<SearchCommand | null> => {
    try {
      const res = await apiPost<{ ok: boolean; preview: SearchCommand }>(`/api/search/commands/${id}/preview`, {});
      return res.preview || null;
    } catch { return null; }
  }, []);

  const runCommand = useCallback(async (id: string, params: Record<string, string> = {}): Promise<CommandRunResponse | null> => {
    try {
      return await apiPost<CommandRunResponse>(`/api/search/commands/${id}/run`, params);
    } catch { return null; }
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([], workspaceId);
  }, [workspaceId]);

  return {
    results, groups, commands, history, loading, error, enabled,
    query, setQuery, search, loadCommands, previewCommand, runCommand, clearHistory,
  };
}
