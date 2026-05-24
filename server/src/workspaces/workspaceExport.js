'use strict';

const fs    = require('fs');
const path  = require('path');
const crypto = require('crypto');
const store = require('./workspaceStore');
const { sanitizeForExport, validateWorkspaceId } = require('./workspaceSafety');
const { validateProfile, DEFAULT_SETTINGS, normalizeSettings } = require('./workspaceTypes');
const workspaceContext = require('./workspaceContext');

const EXPORT_DIR = path.join(process.cwd(), 'runtime', 'workspaces', 'exports');
const EXPORT_VERSION = '2.0';
const SAFE_FILE_RE = /^[a-zA-Z0-9_.-]{1,80}\.json$/;
const SAFE_RUN_ID_RE = /^[a-zA-Z0-9_-]{1,80}$/;

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${stableJson(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function checksum(value) {
  return crypto.createHash('sha256').update(stableJson(value)).digest('hex');
}

function maskExportValue(value, key = '') {
  const secretKey = /secret|token|password|api[_-]?key|authorization|credential/i.test(key);
  if (secretKey) return '[MASQUE]';
  if (typeof value === 'string') {
    return require('./workspaceSafety').maskSecrets(value)
      .replace(/[A-Za-z]:\\[^"'\r\n]+/g, '[CHEMIN_MASQUE]')
      .replace(/\/(?:home|Users|tmp|var|etc)\/[^"'\r\n]+/g, '[CHEMIN_MASQUE]');
  }
  if (Array.isArray(value)) return value.map(v => maskExportValue(v, key));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, maskExportValue(v, k)]));
  }
  return value;
}

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function readJsonDir(dir) {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
      .filter(file => SAFE_FILE_RE.test(file))
      .map(file => ({ file, data: readJson(path.join(dir, file), null) }))
      .filter(entry => entry.data !== null);
  } catch {
    return [];
  }
}

function readRuns(dir) {
  return readJsonDir(dir)
    .map(entry => entry.data)
    .filter(run => run && SAFE_RUN_ID_RE.test(String(run.runId || '')));
}

function collectWorkspaceData(ctx) {
  return maskExportValue({
    memory: {
      memory: readJson(path.join(ctx.memory, 'memory.json'), null),
      index:  readJson(path.join(ctx.memory, 'index.json'), null),
    },
    rag: {
      index:    readJson(path.join(ctx.rag, 'index.json'), null),
      chunks:   readJson(path.join(ctx.rag, 'chunks.json'), []),
      metadata: readJson(path.join(ctx.rag, 'metadata.json'), null),
    },
    knowledge: {
      items:    readJson(path.join(ctx.knowledge, 'items.json'), []),
      metadata: readJson(path.join(ctx.knowledge, 'metadata.json'), null),
    },
    agents: {
      memory: readJson(path.join(ctx.agents, 'memory.json'), null),
      runs:   readRuns(ctx.agentRuns),
    },
    workflows: {
      definitions: readJson(path.join(ctx.workflows, 'definitions.json'), []),
      runs:        readRuns(ctx.workflowRuns),
    },
    dashboards: {
      files: readJsonDir(ctx.dashboards),
    },
    commandHistory: {
      files: readJsonDir(ctx.searchHistory),
    },
    pluginsSettings: readJson(ctx.plugins, { enabled: {}, localOnly: true }),
    metadata: readJson(ctx.metadata, {}),
  });
}

function countDataItems(data) {
  return [
    data?.memory?.memory?.items,
    data?.memory?.index,
    data?.rag?.chunks,
    data?.knowledge?.items,
    data?.agents?.runs,
    data?.workflows?.definitions,
    data?.workflows?.runs,
    data?.dashboards?.files,
    data?.commandHistory?.files,
  ].reduce((total, value) => total + (Array.isArray(value) ? value.length : 0), 0);
}

function exportWorkspace(id) {
  if (!validateWorkspaceId(id)) throw new Error('id_invalide');
  const profile = store.getProfile(id);
  if (!profile) throw new Error('workspace_introuvable');

  const clean    = sanitizeForExport(profile);
  const ctx      = require('./workspaceContext').getContextPaths(id);
  let settings = { ...DEFAULT_SETTINGS };
  if (fs.existsSync(ctx.settings)) {
    try { settings = normalizeSettings(JSON.parse(fs.readFileSync(ctx.settings, 'utf8'))); }
    catch { settings = { ...DEFAULT_SETTINGS }; }
  }

  const data = collectWorkspaceData(ctx);
  const signed = { profile: clean, settings, data };
  const payload = {
    profile: clean,
    settings,
    data,
    version: EXPORT_VERSION,
    localOnly: true,
    metadata: {
      exportSchema: 'sallon-workspace-export',
      exportVersion: EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      checksumAlgorithm: 'sha256',
      checksum: checksum(signed),
    },
  };

  if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });
  const filename = `workspace-${id}-${Date.now().toString(36)}.json`;
  const filepath = path.join(EXPORT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(payload, null, 2), 'utf8');
  return { ok: true, filename, totalItems: 1 + countDataItems(data), checksum: payload.metadata.checksum };
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(maskExportValue(data), null, 2), 'utf8');
}

function assertArray(value, name) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`${name}_invalide`);
  return value;
}

function validateData(data) {
  if (data === undefined || data === null) return {};
  if (typeof data !== 'object' || Array.isArray(data)) throw new Error('data_invalide');
  assertArray(data?.rag?.chunks, 'rag_chunks');
  assertArray(data?.knowledge?.items, 'knowledge_items');
  assertArray(data?.agents?.runs, 'agent_runs');
  assertArray(data?.workflows?.definitions, 'workflow_definitions');
  assertArray(data?.workflows?.runs, 'workflow_runs');
  assertArray(data?.dashboards?.files, 'dashboards_files');
  assertArray(data?.commandHistory?.files, 'command_history_files');
  for (const run of [...assertArray(data?.agents?.runs, 'agent_runs'), ...assertArray(data?.workflows?.runs, 'workflow_runs')]) {
    if (!run || !SAFE_RUN_ID_RE.test(String(run.runId || ''))) throw new Error('runId_import_invalide');
  }
  for (const entry of [...assertArray(data?.dashboards?.files, 'dashboards_files'), ...assertArray(data?.commandHistory?.files, 'command_history_files')]) {
    if (!entry || !SAFE_FILE_RE.test(String(entry.file || ''))) throw new Error('filename_import_invalide');
  }
  return data;
}

function restoreJsonDir(dir, files) {
  ensureDir(dir);
  for (const entry of files) {
    writeJson(path.join(dir, entry.file), entry.data ?? null);
  }
}

function restoreRuns(dir, runs) {
  ensureDir(dir);
  for (const run of runs) {
    writeJson(path.join(dir, `${run.runId}.json`), run);
  }
}

function restoreWorkspaceData(id, data) {
  const ctx = workspaceContext.getContextPaths(id);
  if (data?.memory?.memory !== undefined) writeJson(path.join(ctx.memory, 'memory.json'), data.memory.memory);
  if (data?.memory?.index !== undefined) writeJson(path.join(ctx.memory, 'index.json'), data.memory.index);
  if (data?.rag?.index !== undefined) writeJson(path.join(ctx.rag, 'index.json'), data.rag.index);
  if (data?.rag?.chunks !== undefined) writeJson(path.join(ctx.rag, 'chunks.json'), data.rag.chunks);
  if (data?.rag?.metadata !== undefined) writeJson(path.join(ctx.rag, 'metadata.json'), data.rag.metadata);
  if (data?.knowledge?.items !== undefined) writeJson(path.join(ctx.knowledge, 'items.json'), data.knowledge.items);
  if (data?.knowledge?.metadata !== undefined) writeJson(path.join(ctx.knowledge, 'metadata.json'), data.knowledge.metadata);
  if (data?.agents?.memory !== undefined) writeJson(path.join(ctx.agents, 'memory.json'), data.agents.memory);
  restoreRuns(ctx.agentRuns, assertArray(data?.agents?.runs, 'agent_runs'));
  if (data?.workflows?.definitions !== undefined) writeJson(path.join(ctx.workflows, 'definitions.json'), data.workflows.definitions);
  restoreRuns(ctx.workflowRuns, assertArray(data?.workflows?.runs, 'workflow_runs'));
  restoreJsonDir(ctx.dashboards, assertArray(data?.dashboards?.files, 'dashboards_files'));
  restoreJsonDir(ctx.searchHistory, assertArray(data?.commandHistory?.files, 'command_history_files'));
  if (data?.pluginsSettings !== undefined) writeJson(ctx.plugins, data.pluginsSettings);
  if (data?.metadata !== undefined) writeJson(ctx.metadata, data.metadata);
}

function importWorkspace(payload) {
  if (!payload || typeof payload !== 'object') throw new Error('payload_invalide');
  if (payload.localOnly === false) throw new Error('localOnly_requis');
  if (!payload.profile) throw new Error('profile_manquant');
  if (payload.version && !['1.0', EXPORT_VERSION].includes(payload.version)) throw new Error('version_import_invalide');

  const { profile, settings } = payload;
  if (profile.localOnly === false) throw new Error('localOnly_requis');
  if (profile.isDefault === true) throw new Error('import_default_interdit');
  if (!validateWorkspaceId(profile.id)) throw new Error('id_invalide');
  const v = validateProfile(profile);
  if (!v.valid) throw new Error(`validation_profile: ${v.errors.join(', ')}`);
  const data = validateData(payload.data);
  if (payload.metadata?.checksum) {
    const expected = checksum({ profile, settings: normalizeSettings(settings || profile.settings || {}), data });
    if (payload.metadata.checksum !== expected) throw new Error('checksum_import_invalide');
  }

  const merged = {
    ...profile,
    settings: normalizeSettings({ ...(profile.settings || {}), ...(settings || {}) }),
    isDefault: false,
    importedAt: new Date().toISOString(),
    localOnly:  true,
  };
  const created = store.createProfile(merged);
  restoreWorkspaceData(created.id, data);
  return created;
}

module.exports = { exportWorkspace, importWorkspace, collectWorkspaceData, validateData, EXPORT_VERSION };
