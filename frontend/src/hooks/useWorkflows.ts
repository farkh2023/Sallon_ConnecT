'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiGet, apiPost, apiDelete } from '@/lib/api';
import { getStoredWorkspaceId, WORKSPACE_CHANGED_EVENT } from '@/lib/workspaceStorage';
import type {
  WorkflowSummary, WorkflowDefinition, WorkflowRunResult,
  WorkflowRunMeta, WorkflowTemplateSummary,
  WorkflowsListResponse, WorkflowRunsResponse,
} from '@/lib/types';

export function useWorkflows() {
  const [workflows,  setWorkflows]  = useState<WorkflowSummary[]>([]);
  const [templates,  setTemplates]  = useState<WorkflowTemplateSummary[]>([]);
  const [runs,       setRuns]       = useState<WorkflowRunMeta[]>([]);
  const [runResult,  setRunResult]  = useState<WorkflowRunResult | null>(null);
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
      setWorkflows([]);
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

  const loadWorkflows = useCallback(async () => {
    try {
      const data = await apiGet<WorkflowsListResponse>('/api/ai/workflows');
      if (mounted.current) setWorkflows(data.workflows || []);
    } catch {
      if (mounted.current) setError('Impossible de charger les workflows.');
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    try {
      const data = await apiGet<{ templates: WorkflowTemplateSummary[] }>('/api/ai/workflows/templates');
      if (mounted.current) setTemplates(data.templates || []);
    } catch { /* non bloquant */ }
  }, []);

  const loadRuns = useCallback(async () => {
    try {
      const data = await apiGet<WorkflowRunsResponse>('/api/ai/workflows/runs');
      if (mounted.current) setRuns(data.runs || []);
    } catch { /* non bloquant */ }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- charge initiale, setState apres await dans callbacks memoise
    void loadWorkflows();
    void loadTemplates();
  }, [loadWorkflows, loadTemplates, workspaceId]);

  const runWorkflow = useCallback(async (id: string): Promise<WorkflowRunResult | null> => {
    if (!mounted.current) return null;
    setLoading(true);
    setError(null);
    setRunResult(null);
    try {
      const result = await apiPost<WorkflowRunResult>(`/api/ai/workflows/${id}/run`, {});
      if (mounted.current) {
        setRunResult(result);
        void loadRuns();
      }
      return result;
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Erreur execution workflow');
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [loadRuns]);

  const createFromTemplate = useCallback(async (templateId: string, overrides?: Partial<WorkflowDefinition>): Promise<boolean> => {
    if (!mounted.current) return false;
    setLoading(true);
    setError(null);
    try {
      const tpl = await apiGet<WorkflowDefinition>(`/api/ai/workflows/${templateId}`);
      const newId = `${templateId}-${Date.now().toString(36)}`;
      await apiPost('/api/ai/workflows', {
        ...tpl, ...overrides,
        id: newId, _isTemplate: false,
        createdAt: new Date().toISOString(),
      });
      if (mounted.current) await loadWorkflows();
      return true;
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Erreur creation depuis template');
      return false;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [loadWorkflows]);

  const deleteWorkflow = useCallback(async (id: string): Promise<boolean> => {
    if (!mounted.current) return false;
    setLoading(true);
    setError(null);
    try {
      await apiDelete(`/api/ai/workflows/${id}`, { confirmation: 'SUPPRIMER' });
      if (mounted.current) await loadWorkflows();
      return true;
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Erreur suppression');
      return false;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [loadWorkflows]);

  const exportWorkflow = useCallback(async (id: string): Promise<WorkflowDefinition | null> => {
    try {
      const data = await apiGet<{ ok: boolean; workflow: WorkflowDefinition }>(`/api/ai/workflows/${id}/export`);
      return data.workflow || null;
    } catch { return null; }
  }, []);

  const clearResult = useCallback(() => {
    setRunResult(null);
    setError(null);
  }, []);

  return {
    workflows, templates, runs, runResult, loading, error, workspaceId,
    loadWorkflows, loadTemplates, loadRuns,
    runWorkflow, createFromTemplate, deleteWorkflow, exportWorkflow, clearResult,
  };
}
