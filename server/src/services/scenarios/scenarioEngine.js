'use strict';
/* =============================================
   scenarioEngine.js — Phase 5 + Phase 12
   Modes : simulated (défaut) | assisted | live (bloqué)
   Phase 12 : notifications locales intégrées.
============================================= */

const fs   = require('fs');
const path = require('path');
const registry = require('./scenarioRegistry');
const config   = require('../config');
const notif    = require('../notifications/notificationEngine');

const HISTORY_FILE = path.join(__dirname, '../../../../runtime/scenario-history.json');
const MAX_HISTORY  = 50;

/* ── Helpers historique ────────────────────── */

function readHistory() {
  try {
    const raw = fs.readFileSync(HISTORY_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeHistory(entries) {
  if (!config.scenario.historyEnabled) return;
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(entries, null, 2), 'utf8');
  } catch {
    /* Échec silencieux — l'historique n'est pas critique */
  }
}

function appendHistory(entry) {
  const history = readHistory();
  history.unshift(entry);
  if (history.length > MAX_HISTORY) history.splice(MAX_HISTORY);
  writeHistory(history);
}

/* ── Simulation d'une étape ────────────────── */

function simulateStep(step, scenarioId) {
  const messages = {
    check:   `[SIMULATION] Vérification "${step.label}" — OK (aucune action réelle)`,
    prepare: `[SIMULATION] Préparation "${step.label}" — prête (aucun envoi réel)`,
    suggest: `[SIMULATION] Suggestion : ${step.label} (à confirmer manuellement)`,
    summary: `[SIMULATION] Synthèse du scénario "${scenarioId}" générée avec succès`,
  };
  return {
    stepId:  step.id,
    label:   step.label,
    type:    step.type,
    result:  messages[step.type] || `[SIMULATION] Étape "${step.label}" traitée`,
    status:  'simulated',
    warning: step.connector && step.connector !== null
      ? `Connecteur "${step.connector}" non sollicité en mode simulation`
      : null,
  };
}

/* ── Description d'une étape en mode assisted ─ */

function describeStepAssisted(step) {
  const actions = {
    check:   `Vérifiez manuellement : ${step.label}`,
    prepare: `Préparez manuellement : ${step.label}`,
    suggest: `Action suggérée : ${step.label} — à votre discrétion`,
    summary: `Consultez l'état général du système avant de continuer`,
  };
  return {
    stepId:      step.id,
    label:       step.label,
    type:        step.type,
    instruction: actions[step.type] || `Effectuez manuellement : ${step.label}`,
    status:      'assisted',
    requiresUserAction: step.type !== 'summary',
  };
}

/* ── API publique ──────────────────────────── */

function getCurrentRuntime() {
  const scenarios = registry.getAll();
  return {
    source:    'scenario-engine',
    timestamp: new Date().toISOString(),
    liveEnabled:    config.scenario.liveEnabled,
    historyEnabled: config.scenario.historyEnabled,
    count:     scenarios.length,
    scenarios: scenarios.map(s => ({
      id:               s.id,
      name:             s.name,
      description:      s.description,
      icon:             s.icon,
      safetyLevel:      s.safetyLevel,
      requiredDevices:  s.requiredDevices,
      requiredServices: s.requiredServices,
      stepCount:        s.steps.length,
      mode:             'simulated',
      status:           'ready',
    })),
  };
}

function preview(id) {
  const scenario = registry.getById(id);
  if (!scenario) return { error: `Scénario "${id}" introuvable` };

  return {
    scenarioId:   scenario.id,
    scenarioName: scenario.name,
    description:  scenario.description,
    icon:         scenario.icon,
    safetyLevel:  scenario.safetyLevel,
    requiredDevices:  scenario.requiredDevices,
    requiredServices: scenario.requiredServices,
    steps: scenario.steps.map(step => ({
      id:        step.id,
      label:     step.label,
      type:      step.type,
      connector: step.connector || null,
      preview:   `[APERÇU] ${step.label}`,
    })),
    note: 'Aperçu uniquement — aucune action exécutée.',
  };
}

function run(id, mode = 'simulated') {
  const scenario = registry.getById(id);
  if (!scenario) return { error: `Scénario "${id}" introuvable` };

  /* Bloquer le mode live par défaut */
  if (mode === 'live') {
    if (!config.scenario.liveEnabled) {
      notif.notify({ type: 'scenario', level: 'warning',
        title: 'Scénario live refusé',
        message: `Mode live désactivé — scénario "${scenario.name}" non exécuté`,
        meta: { scenarioId: id, mode },
      });
      return {
        error: 'Le mode live est désactivé par sécurité.',
        hint:  'Activez SCENARIO_LIVE_ENABLED=true seulement si vous comprenez les risques.',
      };
    }
    /* Mode live activé : non implémenté dans cette phase */
    notif.notify({ type: 'scenario', level: 'warning',
      title: 'Scénario live non implémenté',
      message: `Le mode live n'est pas encore disponible pour "${scenario.name}"`,
      meta: { scenarioId: id },
    });
    return {
      error: 'Le mode live est activé dans .env mais non encore implémenté dans cette phase.',
      hint:  'Utilisez le mode "simulated" ou "assisted" pour l\'instant.',
    };
  }

  const startedAt = new Date().toISOString();

  notif.notify({ type: 'scenario', level: 'info',
    title: `Scénario démarré : ${scenario.name}`,
    message: `Mode : ${mode} — ${scenario.steps.length} étape(s)`,
    meta: { scenarioId: id, mode },
  });

  let stepsExecuted, warnings;

  if (mode === 'assisted') {
    stepsExecuted = scenario.steps.map(step => describeStepAssisted(step));
    warnings      = ['Mode assisté : aucune action automatique. Confirmez chaque étape manuellement.'];
  } else {
    /* mode simulated (défaut) */
    stepsExecuted = scenario.steps.map(step => simulateStep(step, id));
    warnings      = stepsExecuted
      .filter(s => s.warning)
      .map(s => s.warning);
  }

  const finishedAt = new Date().toISOString();

  const historyEntry = {
    scenarioId:   scenario.id,
    scenarioName: scenario.name,
    mode,
    startedAt,
    finishedAt,
    status:       'completed',
    stepsExecuted: stepsExecuted.length,
    warnings:     warnings.filter(Boolean),
    source:       'scenarioEngine',
  };

  appendHistory(historyEntry);

  notif.notify({ type: 'scenario', level: 'success',
    title: `Scénario terminé : ${scenario.name}`,
    message: `${stepsExecuted.length} étape(s) complétée(s) en mode ${mode}`,
    meta: { scenarioId: id, mode, stepsCount: stepsExecuted.length },
  });

  return {
    scenarioId:   scenario.id,
    scenarioName: scenario.name,
    icon:         scenario.icon,
    mode,
    status:       'completed',
    startedAt,
    finishedAt,
    stepsExecuted,
    warnings:     warnings.filter(Boolean),
    summary:      mode === 'assisted'
      ? `Scénario "${scenario.name}" en mode assisté — confirmez chaque action ci-dessus.`
      : `Scénario "${scenario.name}" simulé avec succès. Aucune action réelle effectuée.`,
  };
}

function stop(id) {
  const scenario = registry.getById(id);
  if (!scenario) return { error: `Scénario "${id}" introuvable` };
  return {
    scenarioId: id,
    status:     'stopped',
    message:    'Aucun scénario actif à arrêter (mode simulation stateless).',
  };
}

function getHistory() {
  return readHistory();
}

function clearHistory() {
  writeHistory([]);
  return { cleared: true };
}

module.exports = { getCurrentRuntime, preview, run, stop, getHistory, clearHistory };
