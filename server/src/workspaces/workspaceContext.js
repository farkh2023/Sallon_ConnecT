'use strict';

const path  = require('path');
const store = require('./workspaceStore');
const { validateWorkspaceId } = require('./workspaceSafety');
const { DEFAULT_ID } = require('./workspaceTypes');

const LEGACY_FALLBACK = () => process.env.SALLON_WORKSPACE_LEGACY_FALLBACK !== 'false';

function safeJoin(root, ...parts) {
  const resolvedRoot = path.resolve(root);
  const target = path.resolve(root, ...parts);
  if (target !== resolvedRoot && !target.startsWith(resolvedRoot + path.sep)) {
    throw new Error('path_traversal_bloque');
  }
  return target;
}

function legacyRuntimePath(...parts) {
  return path.resolve(process.cwd(), 'runtime', ...parts);
}

function getExplicitWorkspaceId(req) {
  const headerId = req?.headers?.['x-workspace-id'];
  const queryId  = req?.query?.workspaceId;
  const bodyId   = req?.body?.workspaceId;
  const raw = headerId || queryId || bodyId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

function resolveWorkspaceId(workspaceId, options = {}) {
  const explicit = Object.prototype.hasOwnProperty.call(options, 'explicit')
    ? options.explicit
    : !!workspaceId;
  const id = workspaceId || store.getCurrentId();
  if (!validateWorkspaceId(id)) throw new Error('id_invalide');
  if (!store.getProfile(id)) {
    if (explicit) throw new Error('workspace_introuvable');
    const fallback = DEFAULT_ID();
    if (!store.getProfile(fallback)) store.init();
    return fallback;
  }
  return id;
}

function getContextPaths(workspaceId) {
  store.init();
  const id  = resolveWorkspaceId(workspaceId, { explicit: !!workspaceId });
  const dir = store.getWorkspaceDir(id);
  const isDefault = id === DEFAULT_ID();
  const legacy = isDefault && LEGACY_FALLBACK();
  const runtime = legacy ? legacyRuntimePath() : dir;
  return {
    workspaceId: id,
    root:        dir,
    runtime,
    memory:      legacy ? legacyRuntimePath('ai-memory') : safeJoin(dir, 'memory'),
    rag:         legacy ? legacyRuntimePath('rag') : safeJoin(dir, 'rag'),
    knowledge:   legacy ? legacyRuntimePath('knowledge') : safeJoin(dir, 'knowledge'),
    workflows:   legacy ? legacyRuntimePath('workflows') : safeJoin(dir, 'workflows'),
    workflowRuns: legacy ? legacyRuntimePath('workflows', 'runs') : safeJoin(dir, 'workflows', 'runs'),
    workflowExports: legacy ? legacyRuntimePath('workflows', 'exports') : safeJoin(dir, 'workflows', 'exports'),
    agents:      legacy ? legacyRuntimePath('agents') : safeJoin(dir, 'agents'),
    agentRuns:   legacy ? legacyRuntimePath('agents', 'runs') : safeJoin(dir, 'agents', 'runs'),
    dashboards:  safeJoin(dir, 'dashboards'),
    searchHistory: safeJoin(dir, 'search-history'),
    plugins:     safeJoin(dir, 'plugins.json'),
    settings:    safeJoin(dir, 'settings.json'),
    metadata:    safeJoin(dir, 'metadata.json'),
    legacyDefault: isDefault,
  };
}

function getCurrentContext() {
  return getContextPaths(store.getCurrentId());
}

function contextForRequest(req) {
  const explicitId = getExplicitWorkspaceId(req);
  return getContextPaths(explicitId || store.getCurrentId());
}

function getWorkspaceRuntimePath(workspaceId) {
  return getContextPaths(workspaceId).runtime;
}

function getRagPath(workspaceId) {
  return getContextPaths(workspaceId).rag;
}

function getKnowledgePath(workspaceId) {
  return getContextPaths(workspaceId).knowledge;
}

function getAgentsPath(workspaceId) {
  return getContextPaths(workspaceId).agents;
}

function getWorkflowsPath(workspaceId) {
  return getContextPaths(workspaceId).workflows;
}

function getWorkflowRunsPath(workspaceId) {
  return getContextPaths(workspaceId).workflowRuns;
}

function getAgentRunsPath(workspaceId) {
  return getContextPaths(workspaceId).agentRuns;
}

function getWorkspaceOptions(req) {
  const explicitId = getExplicitWorkspaceId(req);
  const context = getContextPaths(explicitId || store.getCurrentId());
  return {
    context,
    explicit: !!explicitId,
    options: explicitId ? { workspaceId: context.workspaceId } : undefined,
  };
}

module.exports = {
  getContextPaths,
  getCurrentContext,
  contextForRequest,
  getExplicitWorkspaceId,
  getWorkspaceOptions,
  getWorkspaceRuntimePath,
  getRagPath,
  getKnowledgePath,
  getAgentsPath,
  getWorkflowsPath,
  getWorkflowRunsPath,
  getAgentRunsPath,
  safeJoin,
};
