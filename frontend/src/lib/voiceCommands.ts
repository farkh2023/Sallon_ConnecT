import type { TvModeState, VoiceCommand, VoiceCommandIntent, VoiceCommandResult } from '@/lib/types';
import {
  buildSafeVoiceResponse,
  classifySensitiveVoiceCommand,
  isVoiceIntentAllowed,
  sanitizeTranscript,
} from '@/lib/voiceSafety';

export interface VoiceCommandContext {
  navigateToSection: (sectionId: string, activePanel?: TvModeState['activePanel']) => void;
  refresh: () => void;
  setTvMode: (enabled: boolean) => void;
  toggleFullscreen: (mode?: 'enter' | 'exit' | 'toggle') => void | Promise<void>;
  readStatus: () => string;
}

const NAVIGATION_TARGETS: Array<{ section: string; activePanel?: TvModeState['activePanel']; patterns: RegExp[]; label: string }> = [
  { section: 'hero', activePanel: 'dashboard', label: 'Hub', patterns: [/ouvre.*hub/i, /affiche.*hub/i] },
  { section: 'appareils', label: 'Appareils', patterns: [/ouvre.*appareils/i, /affiche.*appareils/i] },
  { section: 'agents', label: 'Agents', patterns: [/ouvre.*agents/i, /affiche.*agents/i] },
  { section: 'media', activePanel: 'media', label: 'Medias', patterns: [/ouvre.*m[eé]dias/i, /affiche.*m[eé]dias/i] },
  { section: 'scenarios', label: 'Scenarios', patterns: [/ouvre.*sc[eé]narios/i, /affiche.*sc[eé]narios/i] },
  { section: 'notifications', activePanel: 'notifications', label: 'Notifications', patterns: [/ouvre.*notifications/i, /affiche.*notifications/i] },
  { section: 'observabilite', activePanel: 'observability', label: 'Observabilite', patterns: [/ouvre.*observabilit[eé]/i, /affiche.*observabilit[eé]/i] },
  { section: 'taches', activePanel: 'scheduler', label: 'Taches', patterns: [/ouvre.*t[aâ]ches/i, /affiche.*t[aâ]ches/i] },
  { section: 'profils', label: 'Profils', patterns: [/ouvre.*profils/i, /affiche.*profils/i] },
  { section: 'sauvegarde', label: 'Sauvegarde', patterns: [/ouvre.*sauvegarde/i, /affiche.*sauvegarde/i] },
];

function result(command: VoiceCommand, ok: boolean, message: string, blocked = false): VoiceCommandResult {
  return buildSafeVoiceResponse({
    ok,
    intent: command.intent,
    message,
    blocked,
    transcript: command.transcript,
    targetSection: command.targetSection,
  });
}

export function matchCommand(transcript: string): VoiceCommand {
  const clean = sanitizeTranscript(transcript);
  const sensitive = classifySensitiveVoiceCommand(clean);
  if (sensitive.sensitive && sensitive.intent) {
    return {
      transcript: clean,
      intent: sensitive.intent,
      label: sensitive.label || 'Action sensible',
      sensitive: true,
      confidence: 1,
    };
  }

  for (const target of NAVIGATION_TARGETS) {
    if (target.patterns.some((pattern) => pattern.test(clean))) {
      const intent: VoiceCommandIntent = target.activePanel ? 'openPanel' : 'navigate';
      return {
        transcript: clean,
        intent,
        label: `Ouvrir ${target.label}`,
        targetSection: target.section,
        activePanel: target.activePanel,
        sensitive: false,
        confidence: 0.95,
      };
    }
  }

  if (/^(actualise|rafraichis|scanne.*statut|scan.*statut)/i.test(clean)) {
    return { transcript: clean, intent: 'refresh', label: 'Actualiser', sensitive: false, confidence: 0.95 };
  }
  if (/affiche.*notifications/i.test(clean)) {
    return { transcript: clean, intent: 'showNotifications', label: 'Afficher notifications', targetSection: 'notifications', activePanel: 'notifications', sensitive: false, confidence: 0.95 };
  }
  if (/affiche.*t[aâ]ches/i.test(clean)) {
    return { transcript: clean, intent: 'showScheduler', label: 'Afficher taches', targetSection: 'taches', activePanel: 'scheduler', sensitive: false, confidence: 0.95 };
  }
  if (/affiche.*observabilit[eé]/i.test(clean)) {
    return { transcript: clean, intent: 'showObservability', label: 'Afficher observabilite', targetSection: 'observabilite', activePanel: 'observability', sensitive: false, confidence: 0.95 };
  }
  if (/active.*mode tv/i.test(clean)) {
    return { transcript: clean, intent: 'toggleTvMode', label: 'Activer mode TV', sensitive: false, confidence: 0.95 };
  }
  if (/d[eé]sactive.*mode tv/i.test(clean)) {
    return { transcript: clean, intent: 'toggleTvMode', label: 'Desactiver mode TV', sensitive: false, confidence: 0.95 };
  }
  if (/quitte.*plein [eé]cran/i.test(clean)) {
    return { transcript: clean, intent: 'toggleFullscreen', label: 'Quitter plein ecran', sensitive: false, confidence: 0.95 };
  }
  if (/plein [eé]cran/i.test(clean)) {
    return { transcript: clean, intent: 'toggleFullscreen', label: 'Plein ecran', sensitive: false, confidence: 0.9 };
  }
  if (/aide vocale|aide/i.test(clean)) {
    return { transcript: clean, intent: 'help', label: 'Aide vocale', sensitive: false, confidence: 0.9 };
  }
  if (/statut.*syst[eè]me|etat.*syst[eè]me/i.test(clean)) {
    return { transcript: clean, intent: 'readStatus', label: 'Statut systeme', sensitive: false, confidence: 0.9 };
  }

  return { transcript: clean, intent: 'help', label: 'Commande inconnue', sensitive: false, confidence: 0.1 };
}

export function parseVoiceCommand(transcript: string): VoiceCommand {
  return matchCommand(transcript);
}

export async function executeSafeVoiceCommand(command: VoiceCommand, context: VoiceCommandContext): Promise<VoiceCommandResult> {
  if (command.sensitive || !isVoiceIntentAllowed(command.intent)) {
    return result(command, false, 'Commande refusee : action sensible bloquee localement.', true);
  }

  switch (command.intent) {
    case 'navigate':
    case 'openPanel':
      if (command.targetSection) {
        context.navigateToSection(command.targetSection, command.activePanel);
        return result(command, true, `Ouverture : ${command.label}.`);
      }
      return result(command, false, 'Section introuvable.', false);
    case 'refresh':
      context.refresh();
      return result(command, true, 'Actualisation demandee.');
    case 'showNotifications':
      context.navigateToSection('notifications', 'notifications');
      return result(command, true, 'Notifications ouvertes.');
    case 'showScheduler':
      context.navigateToSection('taches', 'scheduler');
      return result(command, true, 'Taches ouvertes.');
    case 'showObservability':
      context.navigateToSection('observabilite', 'observability');
      return result(command, true, 'Observabilite ouverte.');
    case 'toggleTvMode':
      context.setTvMode(!/^d[eé]sactive/i.test(command.transcript));
      return result(command, true, `${command.label}.`);
    case 'toggleFullscreen':
      await context.toggleFullscreen(/^quitte/i.test(command.transcript) ? 'exit' : 'enter');
      return result(command, true, `${command.label}.`);
    case 'readStatus':
      return result(command, true, context.readStatus());
    case 'help':
      return result(command, true, 'Commande non reconnue. Dites par exemple : ouvre les appareils, actualise, active le mode TV.');
    default:
      return result(command, false, 'Commande refusee.', true);
  }
}

export function getVoiceHelpCommands(): string[] {
  return [
    'ouvre le hub',
    'ouvre les appareils',
    'ouvre les agents',
    'ouvre les medias',
    'ouvre les scenarios',
    'ouvre les notifications',
    'ouvre les taches',
    'ouvre les profils',
    'ouvre la sauvegarde',
    "ouvre l'observabilite",
    'actualise',
    'scanne le statut',
    'affiche les notifications',
    'affiche les taches',
    "affiche l'observabilite",
    'active le mode TV',
    'desactive le mode TV',
    'plein ecran',
    'quitte le plein ecran',
    'statut du systeme',
    'aide vocale',
  ];
}
