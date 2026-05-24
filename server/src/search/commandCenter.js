'use strict';

const { getCommand }      = require('./commandRegistry');
const { isActionBlocked } = require('./globalSearchSafety');

function previewCommand(id) {
  const cmd = getCommand(id);
  if (!cmd) return null;
  return {
    id:             cmd.id,
    title:          cmd.title,
    description:    cmd.description,
    category:       cmd.category,
    target:         cmd.target,
    actions:        cmd.actions,
    tags:           cmd.tags,
    safe:           cmd.safe,
    dryRunRequired: cmd.dryRunRequired,
    localOnly:      true,
  };
}

function runCommand(id, params = {}) {
  const cmd = getCommand(id);
  if (!cmd) return { ok: false, error: 'commande_introuvable' };
  if (!cmd.safe) return { ok: false, error: 'commande_non_securisee' };

  for (const action of cmd.actions) {
    if (isActionBlocked(action)) {
      return { ok: false, error: `action_bloquee: ${action}` };
    }
  }

  // Navigation commands return a target URL — the frontend handles the redirect
  if (cmd.category === 'navigation') {
    return { ok: true, action: 'navigate', target: cmd.target, command: cmd.id, dryRun: false };
  }

  // Search commands return a search intent
  if (cmd.category === 'search') {
    return {
      ok:      true,
      action:  'search',
      target:  cmd.target,
      command: cmd.id,
      query:   params.query || null,
      dryRun:  false,
    };
  }

  // Action commands (dry-run only)
  if (cmd.category === 'action') {
    if (cmd.actions.some(action => action.startsWith('workspace.'))) {
      return {
        ok:      true,
        action:  'navigate',
        target:  cmd.target,
        command: cmd.id,
        dryRun:  false,
        message: 'Action workspace ouverte dans le gestionnaire local. Aucune suppression rapide disponible.',
      };
    }
    if (!cmd.dryRunRequired) return { ok: false, error: 'mode_non_supporte' };
    return {
      ok:      true,
      action:  'dry-run',
      target:  cmd.target,
      command: cmd.id,
      dryRun:  true,
      message: `Commande "${cmd.title}" simulee en dry-run. Aucune action reelle effectuee.`,
    };
  }

  // Utility commands (copy etc.)
  return { ok: true, action: cmd.actions[0], command: cmd.id, dryRun: false };
}

module.exports = { previewCommand, runCommand };
