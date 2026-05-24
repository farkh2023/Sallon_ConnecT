'use strict';

/**
 * Scheduler local de workflows Phase 48.
 * Seul le trigger "manual" est actif par defaut.
 * Les triggers "interval" et "startup" sont desactives par defaut.
 */

const SCHEDULER_ENABLED = () => process.env.SALLON_WORKFLOWS_SCHEDULER_ENABLED === 'true';

function getTriggerInfo(workflow) {
  const triggers = workflow.triggers || [{ type: 'manual' }];
  return triggers.map(t => ({
    type:     t.type || 'manual',
    active:   t.type === 'manual' || (SCHEDULER_ENABLED() && t.type !== 'manual'),
    details:  t,
  }));
}

function isManualOnly(workflow) {
  const triggers = workflow.triggers || [];
  return triggers.every(t => t.type === 'manual');
}

/**
 * Retourne les workflows eligibles a une execution automatique.
 * Aucun workflow n'est automatique par defaut — necesssite SALLON_WORKFLOWS_SCHEDULER_ENABLED=true.
 */
function getScheduledWorkflows(workflows) {
  if (!SCHEDULER_ENABLED()) return [];
  return workflows.filter(wf => {
    if (!wf.enabled) return false;
    const triggers = wf.triggers || [];
    return triggers.some(t => t.type === 'interval' || t.type === 'startup');
  });
}

module.exports = { getTriggerInfo, isManualOnly, getScheduledWorkflows };
