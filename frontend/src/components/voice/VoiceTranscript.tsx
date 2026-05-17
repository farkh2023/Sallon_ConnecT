import type { VoiceTranscriptEntry } from '@/lib/types';

interface VoiceTranscriptProps {
  transcript: string;
  history: VoiceTranscriptEntry[];
}

export function VoiceTranscript({ transcript, history }: VoiceTranscriptProps) {
  return (
    <div className="space-y-2">
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
        <p className="text-xs uppercase text-slate-500">Dernier transcript</p>
        <p className="mt-1 text-sm text-slate-200">{transcript || 'Aucune commande recue.'}</p>
      </div>
      <div className="max-h-36 space-y-2 overflow-y-auto">
        {history.length === 0 ? (
          <p className="text-xs text-slate-500">Historique local en memoire uniquement.</p>
        ) : history.map((entry) => (
          <div key={entry.id} className="rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
            <div className="text-slate-400">{new Date(entry.at).toLocaleTimeString('fr-FR')} - {entry.transcript}</div>
            <div className={entry.result.blocked ? 'text-red-300' : 'text-emerald-300'}>{entry.result.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
