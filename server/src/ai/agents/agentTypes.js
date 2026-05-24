'use strict';

/**
 * Types et manifestes des agents IA locaux Phase 47.
 * Chaque agent est local-only, dry-run par defaut, sans action destructive.
 */

const BUILT_IN_AGENTS = [
  {
    id:          'diagnostic-agent',
    name:        'Diagnostic Agent',
    description: 'Analyse diagnostics systeme, SSE, service, tray, plugins et widgets. Propose des recommandations sures.',
    model:       process.env.SALLON_AI_MODEL || 'qwen2.5:7b',
    tools:       ['diagnostics.read', 'rag.search', 'notifications.create'],
    permissions: ['ai-chat', 'ai-diagnostics', 'rag-read'],
    enabled:     true,
    localOnly:   true,
    dryRun:      true,
    timeout:     parseInt(process.env.SALLON_AGENTS_TIMEOUT_MS || '45000', 10),
  },
  {
    id:          'security-agent',
    name:        'Security Agent',
    description: 'Analyse les risques local-only : secrets, chemins sensibles, permissions plugins, exposition reseau.',
    model:       process.env.SALLON_AI_MODEL || 'qwen2.5:7b',
    tools:       ['diagnostics.read', 'plugins.list', 'rag.search'],
    permissions: ['ai-diagnostics', 'rag-read'],
    enabled:     true,
    localOnly:   true,
    dryRun:      true,
    timeout:     parseInt(process.env.SALLON_AGENTS_TIMEOUT_MS || '45000', 10),
  },
  {
    id:          'backup-agent',
    name:        'Backup Agent',
    description: 'Verifie les sauvegardes locales, statut update, rollback disponible et integrite des snapshots.',
    model:       process.env.SALLON_AI_MODEL || 'qwen2.5:7b',
    tools:       ['backups.status', 'updates.status', 'service.status', 'rag.search'],
    permissions: ['ai-diagnostics', 'rag-read'],
    enabled:     true,
    localOnly:   true,
    dryRun:      true,
    timeout:     parseInt(process.env.SALLON_AGENTS_TIMEOUT_MS || '45000', 10),
  },
  {
    id:          'docs-agent',
    name:        'Documentation Agent',
    description: 'Utilise le RAG local pour repondre sur la documentation Sallon-ConnecT avec citations obligatoires.',
    model:       process.env.SALLON_AI_MODEL || 'qwen2.5:7b',
    tools:       ['rag.search', 'rag.ask'],
    permissions: ['ai-chat', 'rag-read'],
    enabled:     true,
    localOnly:   true,
    dryRun:      true,
    requiresCitations: true,
    timeout:     parseInt(process.env.SALLON_AGENTS_TIMEOUT_MS || '45000', 10),
  },
  {
    id:          'command-agent',
    name:        'Command Agent',
    description: 'Propose des commandes PowerShell sures uniquement. Aucune execution automatique — dry-run toujours.',
    model:       process.env.SALLON_AI_MODEL || 'qwen2.5:7b',
    tools:       ['commands.suggestSafe', 'rag.search'],
    permissions: ['ai-chat'],
    enabled:     true,
    localOnly:   true,
    dryRun:      true,
    timeout:     parseInt(process.env.SALLON_AGENTS_TIMEOUT_MS || '45000', 10),
  },
];

function validateManifest(manifest) {
  const errors = [];
  if (!manifest.id || typeof manifest.id !== 'string') errors.push('id_requis');
  if (!manifest.name || typeof manifest.name !== 'string') errors.push('name_requis');
  if (!Array.isArray(manifest.tools)) errors.push('tools_requis');
  if (manifest.localOnly !== true) errors.push('localOnly_doit_etre_true');
  if (manifest.dryRun !== true) errors.push('dryRun_doit_etre_true');
  return { valid: errors.length === 0, errors };
}

module.exports = { BUILT_IN_AGENTS, validateManifest };
