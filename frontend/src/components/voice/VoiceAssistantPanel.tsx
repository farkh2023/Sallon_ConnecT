'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTvMode } from '@/hooks/useTvMode';
import { useVoiceAssistant } from '@/hooks/useVoiceAssistant';
import type { TvModeState } from '@/lib/types';
import { VoiceButton } from './VoiceButton';
import { VoiceTranscript } from './VoiceTranscript';
import { VoiceCommandHelp } from './VoiceCommandHelp';
import { VoiceSafetyNotice } from './VoiceSafetyNotice';
import { VoiceTextFallback } from './VoiceTextFallback';

interface VoiceAssistantPanelProps {
  open: boolean;
  onClose: () => void;
}

function scrollToSection(sectionId: string) {
  if (typeof document === 'undefined') return;
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function VoiceAssistantPanel({ open, onClose }: VoiceAssistantPanelProps) {
  const tv = useTvMode();

  const context = useMemo(() => ({
    navigateToSection: (sectionId: string, activePanel?: TvModeState['activePanel']) => {
      if (activePanel !== undefined) tv.setActivePanel(activePanel);
      scrollToSection(sectionId);
    },
    refresh: () => {
      tv.requestRefresh();
      scrollToSection('hero');
    },
    setTvMode: (enabled: boolean) => {
      if (enabled) tv.enableTvMode();
      else tv.disableTvMode();
    },
    toggleFullscreen: async (mode?: 'enter' | 'exit' | 'toggle') => {
      if (mode === 'enter') await tv.enterFullscreen();
      else if (mode === 'exit') await tv.exitFullscreen();
      else await tv.toggleFullscreen();
    },
    readStatus: () => `Systeme local disponible. Mode TV ${tv.enabled ? 'actif' : 'inactif'}.`,
  }), [tv]);

  const voice = useVoiceAssistant(context);

  if (!open) return null;

  return (
    <div className="fixed inset-x-4 top-20 z-50 mx-auto max-w-4xl">
      <Card className="max-h-[calc(100vh-6rem)] overflow-y-auto shadow-2xl shadow-black/40" title="Assistant vocal local">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-white/10 px-2 py-1 text-slate-200">Phase 24</span>
              <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-emerald-300">local</span>
              <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-emerald-300">aucun cloud</span>
              <span className="text-slate-500">Support : {voice.isSupported ? 'Web Speech API' : 'fallback texte'}</span>
            </div>
            <Button type="button" variant="ghost" onClick={onClose}>Fermer</Button>
          </div>

          <VoiceSafetyNotice />

          <div className="flex flex-wrap items-center gap-3">
            <VoiceButton isSupported={voice.isSupported} isListening={voice.isListening} onToggle={voice.toggleListening} />
            <span className="text-xs text-slate-500">
              Etat : {voice.isListening ? 'ecoute active' : 'en attente'} - permission : {voice.permissionState}
            </span>
          </div>

          {voice.lastResult && (
            <div className={`rounded-lg border p-3 text-sm ${
              voice.lastResult.blocked
                ? 'border-red-400/20 bg-red-400/10 text-red-200'
                : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'
            }`}>
              {voice.lastResult.message}
            </div>
          )}

          <VoiceTextFallback onSubmit={voice.submitTextCommand} />
          <VoiceTranscript transcript={voice.transcript} history={voice.transcriptHistory} />
          <VoiceCommandHelp />

          <div className="flex justify-end">
            <Button type="button" variant="ghost" onClick={voice.clearTranscriptHistory}>Effacer historique local</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
