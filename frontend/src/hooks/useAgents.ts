'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import { getStoredWorkspaceId, WORKSPACE_CHANGED_EVENT } from '@/lib/workspaceStorage';
import type {
  AgentManifest, AgentRunResult, AgentRunMeta,
  AgentsListResponse, AgentsRunsResponse,
} from '@/lib/types';

export interface AgentRunOptions {
  task:            string;
  selectedAgents?: string[];
  useRag?:         boolean;
  maxSteps?:       number;
  dryRun?:         boolean;
}

export function useAgents() {
  const [agents,     setAgents]     = useState<AgentManifest[]>([]);
  const [runs,       setRuns]       = useState<AgentRunMeta[]>([]);
  const [runResult,  setRunResult]  = useState<AgentRunResult | null>(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState(getStoredWorkspaceId);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const handleWorkspaceChange = () => {
      setWorkspaceId(getStoredWorkspaceId());
      setRuns([]);
      setRunResult(null);
      setError(null);
    };
    window.addEventListener(WORKSPACE_CHANGED_EVENT, handleWorkspaceChange);
    window.addEventListener('storage', handleWorkspaceChange);
    return () => {
      window.removeEventListener(WORKSPACE_CHANGED_EVENT, handleWorkspaceChange);
      window.removeEventListener('storage', handleWorkspaceChange);
    };
  }, []);

  const loadAgents = useCallback(async () => {
    try {
      const data = await apiGet<AgentsListResponse>('/api/ai/agents');
      if (mounted.current) setAgents(data.agents || []);
    } catch {
      if (mounted.current) setError('Impossible de charger la liste des agents.');
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- loadAgents est async, setState apres await
  useEffect(() => { void loadAgents(); }, [loadAgents, workspaceId]);

  const loadRuns = useCallback(async () => {
    try {
      const data = await apiGet<AgentsRunsResponse>('/api/ai/agents/runs');
      if (mounted.current) setRuns(data.runs || []);
    } catch {
      if (mounted.current) setError('Impossible de charger l\'historique des runs.');
    }
  }, []);

  const runAgents = useCallback(async (options: AgentRunOptions): Promise<AgentRunResult | null> => {
    if (!mounted.current) return null;
    setLoading(true);
    setError(null);
    setRunResult(null);
    try {
      const result = await apiPost<AgentRunResult>('/api/ai/agents/run', {
        task:           options.task,
        selectedAgents: options.selectedAgents,
        useRag:         options.useRag ?? false,
        maxSteps:       options.maxSteps,
        dryRun:         options.dryRun ?? true,
      });
      if (mounted.current) {
        setRunResult(result);
        void loadRuns();
      }
      return result;
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Erreur execution agents');
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [loadRuns]);

  const clearResult = useCallback(() => {
    setRunResult(null);
    setError(null);
  }, []);

  return {
    agents, runs, runResult, loading, error, workspaceId,
    loadAgents, loadRuns, runAgents, clearResult,
  };
}
