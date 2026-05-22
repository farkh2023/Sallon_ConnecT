'use client';

import { useEffect } from 'react';
import { useRestoreAssistant } from '@/hooks/useRestoreAssistant';
import type { RestoreAssistantStep } from '@/lib/types';

import { RestoreStepSnapshot }  from './RestoreStepSnapshot';
import { RestoreStepIntegrity } from './RestoreStepIntegrity';
import { RestoreStepDryRun }    from './RestoreStepDryRun';
import { RestoreStepRisk }      from './RestoreStepRisk';
import { RestoreStepChecklist } from './RestoreStepChecklist';
import { RestoreStepCommand }   from './RestoreStepCommand';
import { RestoreRiskBadge }     from './RestoreRiskBadge';

const STEPS: { key: RestoreAssistantStep; label: string }[] = [
  { key: 'snapshot',  label: '1. Snapshot' },
  { key: 'integrity', label: '2. Integrite' },
  { key: 'dryrun',    label: '3. Dry-run' },
  { key: 'risk',      label: '4. Risque' },
  { key: 'checklist', label: '5. Checklist' },
  { key: 'command',   label: '6. Commande' },
];

interface Props {
  snapshotId: string;
  onClose:    () => void;
}

export function RestoreAssistantWizard({ snapshotId, onClose }: Props) {
  const {
    step, setStep,
    loading, error,
    assistant, dryRun, risk, command, checklist,
    loadAssistant, runDryRun, loadRisk, loadManualCommand,
    toggleChecklistItem, resetWizard,
  } = useRestoreAssistant();

  useEffect(() => {
    void loadAssistant(snapshotId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotId]);

  const stepIndex = STEPS.findIndex(s => s.key === step);
  const progress  = ((stepIndex + 1) / STEPS.length) * 100;

  const handleReset = () => {
    resetWizard();
    void loadAssistant(snapshotId);
  };

  return (
    <div className="rounded-2xl border border-amber-400/20 bg-[#0A2540] p-6 shadow-xl">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-amber-300">Assistant de restauration securise</h2>
          <p className="text-xs text-slate-500">Snapshot : <code className="text-slate-300">{snapshotId}</code></p>
        </div>
        <div className="flex items-center gap-2">
          {risk && <RestoreRiskBadge level={risk.level} />}
          <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300">Fermer</button>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-1 flex gap-1">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= stepIndex ? 'bg-amber-400' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      <div className="mb-4 flex justify-between text-[10px] text-slate-600">
        {STEPS.map(s => <span key={s.key}>{s.label.split('. ')[1]}</span>)}
      </div>
      <p className="mb-4 text-xs text-slate-500">{STEPS[stepIndex]?.label} — {Math.round(progress)}% complete</p>

      {/* Erreur globale */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-xs text-red-300">{error}</div>
      )}

      {/* Chargement initial */}
      {loading && !assistant && (
        <div className="py-8 text-center text-sm text-slate-500">Chargement de l&apos;assistant...</div>
      )}

      {/* Étapes */}
      {assistant && step === 'snapshot' && (
        <RestoreStepSnapshot
          assistant={assistant}
          onNext={() => setStep('integrity')}
        />
      )}

      {assistant && step === 'integrity' && (
        <RestoreStepIntegrity
          assistant={assistant}
          onNext={() => setStep('dryrun')}
          onBack={() => setStep('snapshot')}
        />
      )}

      {step === 'dryrun' && (
        <RestoreStepDryRun
          dryRun={dryRun}
          loading={loading}
          onLoad={() => void runDryRun(snapshotId)}
          onNext={() => setStep('risk')}
          onBack={() => setStep('integrity')}
        />
      )}

      {step === 'risk' && (
        <RestoreStepRisk
          risk={risk}
          loading={loading}
          onLoad={() => void loadRisk(snapshotId)}
          onNext={() => setStep('checklist')}
          onBack={() => setStep('dryrun')}
        />
      )}

      {step === 'checklist' && (
        <RestoreStepChecklist
          checklist={checklist}
          onToggle={toggleChecklistItem}
          onNext={() => { void loadManualCommand(snapshotId); setStep('command'); }}
          onBack={() => setStep('risk')}
        />
      )}

      {step === 'command' && (
        <RestoreStepCommand
          command={command}
          loading={loading}
          onLoad={() => void loadManualCommand(snapshotId)}
          onBack={() => setStep('checklist')}
          onReset={handleReset}
        />
      )}

      {/* Rappel sécurité permanent */}
      <p className="mt-4 text-center text-[10px] text-slate-600">
        Aucune restauration automatique — commande PowerShell manuelle uniquement
      </p>
    </div>
  );
}
