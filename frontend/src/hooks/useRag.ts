'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { getStoredWorkspaceId, WORKSPACE_CHANGED_EVENT } from '@/lib/workspaceStorage';
import type {
  RagStatusResponse, RagSearchResponse, RagAskResponse,
} from '@/lib/types';

export function useRag() {
  const [status,       setStatus]       = useState<RagStatusResponse | null>(null);
  const [searchResult, setSearchResult] = useState<RagSearchResponse | null>(null);
  const [askResult,    setAskResult]    = useState<RagAskResponse | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [workspaceId,  setWorkspaceId]  = useState(getStoredWorkspaceId);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const handleWorkspaceChange = () => {
      const next = getStoredWorkspaceId();
      setWorkspaceId(next);
      setSearchResult(null);
      setAskResult(null);
      setError(null);
    };
    window.addEventListener(WORKSPACE_CHANGED_EVENT, handleWorkspaceChange);
    window.addEventListener('storage', handleWorkspaceChange);
    return () => {
      window.removeEventListener(WORKSPACE_CHANGED_EVENT, handleWorkspaceChange);
      window.removeEventListener('storage', handleWorkspaceChange);
    };
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const data = await apiGet<RagStatusResponse>('/api/ai/rag/status');
      if (mounted.current) setStatus(data);
    } catch {
      if (mounted.current) setError('Impossible de joindre le backend RAG.');
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- loadStatus est async, setState apres await
  useEffect(() => { void loadStatus(); }, [loadStatus, workspaceId]);

  const indexDocs = useCallback(async (): Promise<boolean> => {
    if (!mounted.current) return false;
    setLoading(true);
    setError(null);
    try {
      await apiPost('/api/ai/rag/index', {});
      if (mounted.current) await loadStatus();
      return true;
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Erreur indexation');
      return false;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [loadStatus]);

  const search = useCallback(async (query: string, topK?: number): Promise<RagSearchResponse | null> => {
    if (!mounted.current) return null;
    setLoading(true);
    setError(null);
    try {
      const result = await apiPost<RagSearchResponse>('/api/ai/rag/search', { query, topK });
      if (mounted.current) setSearchResult(result);
      return result;
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Erreur recherche');
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const ask = useCallback(async (question: string, topK?: number): Promise<RagAskResponse | null> => {
    if (!mounted.current) return null;
    setLoading(true);
    setError(null);
    setAskResult(null);
    try {
      const result = await apiPost<RagAskResponse>('/api/ai/rag/ask', { question, topK });
      if (mounted.current) setAskResult(result);
      return result;
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Erreur question RAG');
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const clearIndex = useCallback(async (): Promise<boolean> => {
    if (!mounted.current) return false;
    setLoading(true);
    setError(null);
    try {
      await apiPost('/api/ai/rag/clear', { confirmation: 'EFFACER_INDEX' });
      if (mounted.current) {
        setStatus(null);
        setSearchResult(null);
        setAskResult(null);
        await loadStatus();
      }
      return true;
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Erreur suppression index');
      return false;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [loadStatus]);

  const clearResults = useCallback(() => {
    setSearchResult(null);
    setAskResult(null);
    setError(null);
  }, []);

  return {
    status, searchResult, askResult, loading, error, workspaceId,
    loadStatus, indexDocs, search, ask, clearIndex, clearResults,
  };
}
