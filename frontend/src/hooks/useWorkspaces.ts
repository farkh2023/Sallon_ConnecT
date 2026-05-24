'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { setStoredWorkspaceId } from '@/lib/workspaceStorage';
import type {
  WorkspaceProfile, WorkspaceStatusResponse, WorkspaceListResponse,
  WorkspaceSwitchResponse,
} from '@/lib/types';

interface UseWorkspacesReturn {
  profiles:        WorkspaceProfile[];
  current:         WorkspaceProfile | null;
  currentId:       string | null;
  total:           number;
  enabled:         boolean;
  loading:         boolean;
  error:           string | null;
  loadProfiles:    () => Promise<void>;
  createProfile:   (data: Partial<WorkspaceProfile>) => Promise<WorkspaceProfile | null>;
  updateProfile:   (id: string, data: Partial<WorkspaceProfile>) => Promise<WorkspaceProfile | null>;
  deleteProfile:   (id: string, confirmation?: string) => Promise<boolean>;
  switchWorkspace: (id: string) => Promise<boolean>;
  exportProfile:   (id: string) => Promise<boolean>;
  importProfile:   (payload: unknown) => Promise<WorkspaceProfile | null>;
}

export function useWorkspaces(): UseWorkspacesReturn {
  const [profiles,  setProfiles]  = useState<WorkspaceProfile[]>([]);
  const [current,   setCurrent]   = useState<WorkspaceProfile | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [total,     setTotal]     = useState(0);
  const [enabled,   setEnabled]   = useState(true);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const status = await apiGet<WorkspaceStatusResponse>('/api/workspaces/status');
        if (!mounted.current) return;
        setEnabled(status.enabled ?? true);
        setCurrentId(status.current ?? null);
        setStoredWorkspaceId(status.current ?? null);
        setTotal(status.total ?? 0);
      } catch {}
    })();
  }, []);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, cur] = await Promise.all([
        apiGet<WorkspaceListResponse>('/api/workspaces'),
        apiGet<{ ok: boolean; current: WorkspaceProfile | null; id: string }>('/api/workspaces/current'),
      ]);
      if (!mounted.current) return;
      setProfiles(list.profiles || []);
      setTotal(list.total ?? 0);
      setCurrentId(list.current ?? null);
      setStoredWorkspaceId(list.current ?? null);
      setCurrent(cur.current ?? null);
    } catch (e: unknown) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Erreur chargement');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const createProfile = useCallback(async (data: Partial<WorkspaceProfile>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<{ ok: boolean; profile: WorkspaceProfile }>('/api/workspaces', data);
      if (!mounted.current) return null;
      if (res.ok) {
        setProfiles(prev => [...prev, res.profile]);
        setTotal(prev => prev + 1);
        return res.profile;
      }
      return null;
    } catch (e: unknown) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Erreur creation');
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (id: string, data: Partial<WorkspaceProfile>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPut<{ ok: boolean; profile: WorkspaceProfile }>(`/api/workspaces/${id}`, data);
      if (!mounted.current) return null;
      if (res.ok) {
        setProfiles(prev => prev.map(p => p.id === id ? res.profile : p));
        if (current?.id === id) setCurrent(res.profile);
        return res.profile;
      }
      return null;
    } catch (e: unknown) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Erreur mise a jour');
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [current]);

  const deleteProfile = useCallback(async (id: string, confirmation?: string) => {
    setLoading(true);
    setError(null);
    try {
      await apiDelete<{ ok: boolean }>(`/api/workspaces/${id}`, { confirmation });
      if (!mounted.current) return false;
      setProfiles(prev => prev.filter(p => p.id !== id));
      setTotal(prev => Math.max(0, prev - 1));
      return true;
    } catch (e: unknown) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Erreur suppression');
      return false;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const switchWorkspace = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<WorkspaceSwitchResponse>('/api/workspaces/switch', { id });
      if (!mounted.current) return false;
      if (res.ok) {
        setCurrentId(id);
        setStoredWorkspaceId(id);
        setCurrent(res.current ?? null);
        return true;
      }
      return false;
    } catch (e: unknown) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Erreur switch');
      return false;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const exportProfile = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<{ ok: boolean }>(`/api/workspaces/${id}/export`, {});
      if (!mounted.current) return false;
      return res.ok ?? false;
    } catch (e: unknown) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Erreur export');
      return false;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const importProfile = useCallback(async (payload: unknown) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost<{ ok: boolean; profile: WorkspaceProfile }>('/api/workspaces/import', payload);
      if (!mounted.current) return null;
      if (res.ok) {
        setProfiles(prev => [...prev, res.profile]);
        setTotal(prev => prev + 1);
        return res.profile;
      }
      return null;
    } catch (e: unknown) {
      if (mounted.current) setError(e instanceof Error ? e.message : 'Erreur import');
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  return {
    profiles, current, currentId, total, enabled,
    loading, error,
    loadProfiles, createProfile, updateProfile, deleteProfile,
    switchWorkspace, exportProfile, importProfile,
  };
}
