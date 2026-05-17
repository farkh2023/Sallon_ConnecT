import { getVoiceHelpCommands } from '@/lib/voiceCommands';
import { getAllowedVoiceActions, getBlockedVoiceActions } from '@/lib/voiceSafety';

export function VoiceCommandHelp() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Commandes</p>
        <ul className="space-y-1 text-xs text-slate-300">
          {getVoiceHelpCommands().map((command) => <li key={command}>- {command}</li>)}
        </ul>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-emerald-400">Autorise</p>
        <ul className="space-y-1 text-xs text-slate-300">
          {getAllowedVoiceActions().map((action) => <li key={action}>- {action}</li>)}
        </ul>
      </div>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-red-400">Bloque</p>
        <ul className="space-y-1 text-xs text-slate-300">
          {getBlockedVoiceActions().map((action) => <li key={action}>- {action}</li>)}
        </ul>
      </div>
    </div>
  );
}
