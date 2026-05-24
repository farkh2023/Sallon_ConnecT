'use client';

import { useState, useRef, useCallback } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import type {
  RestoreAssistantResponse,
  RestoreDryRunResult,
  RestoreRiskResult,
  RestoreManualCommand,
  RestoreChecklistItem,
  RestoreAssistantStep,
} from '@/lib/types';

const CHECKLIST_DEFAULTS: RestoreChecklistItem[] = [
  { id: 'verified',      label: "J'ai verifie que le snapshot est valide",                        checked: false },
  { id: 'replace',       label: 'Je comprends que les donnees actuelles peuvent etre remplacees', checked: false },
  { id: 'preBackup',     label: "Je comprends qu'un backup pre-restauration sera cree",           checked: false },
  { id: 'servicePause',  label: 'Je comprends que le service peut etre arrete pendant la restauration', checked: false },
  { id: 'manualOnly',    label: 'Je comprends que la restauration se fait uniquement en PowerShell', checked: false },
  { id: 'noAutoRestore', label: "Je confirme qu'aucune restauration automatique n'est lancee par le dashboard", checked: false },
];

export function useRestoreAssistant() {
  const mounted                 = useRef(true);
  const [step, setStep]         = useState<RestoreAssistantStep>('snapshot');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [assistant, setAssistant]   = useState<RestoreAssistantResponse | null>(null);
  const [dryRun, setDryRun]         = useState<RestoreDryRunResult | null>(null);
  const [risk, setRisk]             = useState<RestoreRiskResult | null>(null);
  const [command, setCommand]       = useState<RestoreManualCommand | null>(null);
  const [checklist, setChecklist]   = useState<RestoreChecklistItem[]>(CHECKLIST_DEFAULTS);

  const safe = (fn: () => void) => { if (mounted.current) fn(); };

  const loadAssistant = useCallback(async (snapshotId: string) => {
    safe(() => { setLoading(true); setError(null); });
    try {
      const data = await apiGet<RestoreAssistantResponse>(`/api/backups/${snapshotId}/restore/assistant`);
      safe(() => {
        setAssistant(data);
        setChecklist(CHECKLIST_DEFAULTS);
        setDryRun(null); setRisk(null); setCommand(null);
        setStep('snapshot');
      });
    } catch (e) {
      safe(() => setError(e instanceof Error ? e.message : 'Erreur assistant'));
    } finally {
      safe(() => setLoading(false));
    }
  }, []);

  const runDryRun = useCallback(async (snapshotId: string) => {
    safe(() => { setLoading(true); setError(null); });
    try {
      const data = await apiPost<RestoreDryRunResult>(`/api/backups/${snapshotId}/restore/dry-run`, {});
      safe(() => setDryRun(data));
      return data;
    } catch (e) {
      safe(() => setError(e instanceof Error ? e.message : 'Erreur dry-run'));
      return null;
    } finally {
      safe(() => setLoading(false));
    }
  }, []);

  const loadRisk = useCallback(async (snapshotId: string) => {
    safe(() => { setLoading(true); setError(null); });
    try {
      const data = await apiPost<RestoreRiskResult>(`/api/backups/${snapshotId}/restore/risk`, {});
      safe(() => setRisk(data));
      return data;
    } catch (e) {
      safe(() => setError(e instanceof Error ? e.message : 'Erreur risque'));
      return null;
    } finally {
      safe(() => setLoading(false));
    }
  }, []);

  const loadManualCommand = useCallback(async (snapshotId: string) => {
    safe(() => { setLoading(true); setError(null); });
    try {
      const data = await apiGet<RestoreManualCommand>(`/api/backups/${snapshotId}/restore/command`);
      safe(() => setCommand(data));
      return data;
    } catch (e) {
      safe(() => setError(e instanceof Error ? e.message : 'Erreur commande'));
      return null;
    } finally {
      safe(() => setLoading(false));
    }
  }, []);

  const toggleChecklistItem = useCallback((id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  }, []);

  const canShowCommand = useCallback(() => {
    return checklist.every(item => item.checked);
  }, [checklist]);

  const resetWizard = useCallback(() => {
    setStep('snapshot');
    setAssistant(null);
    setDryRun(null);
    setRisk(null);
    setCommand(null);
    setChecklist(CHECKLIST_DEFAULTS);
    setError(null);
    setLoading(false);
  }, []);

  return {
    step, setStep,
    loading, error,
    assistant, dryRun, risk, command, checklist,
    loadAssistant, runDryRun, loadRisk, loadManualCommand,
    toggleChecklistItem, canShowCommand, resetWizard,
  };
}
