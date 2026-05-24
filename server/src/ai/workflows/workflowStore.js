'use strict';

const fs   = require('fs');
const path = require('path');
const workspaceContext = require('../../workspaces/workspaceContext');

const WF_DIR      = path.join(process.cwd(), 'runtime', 'workflows');
const DEFS_FILE   = path.join(WF_DIR, 'definitions.json');
const RUNS_DIR    = path.join(WF_DIR, 'runs');
const EXPORTS_DIR = path.join(WF_DIR, 'exports');
const MAX_RUNS    = 100;

function _paths(options = {}) {
  const ctx = workspaceContext.getContextPaths(options.workspaceId);
  return {
    workspaceId: ctx.workspaceId,
    wfDir:      ctx.workflows,
    defsFile:   path.join(ctx.workflows, 'definitions.json'),
    runsDir:    ctx.workflowRuns,
    exportsDir: ctx.workflowExports,
  };
}

function _ensureDirs(options = {}) {
  const { wfDir, runsDir, exportsDir } = _paths(options);
  for (const dir of [wfDir, runsDir, exportsDir]) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }
}

function _readDefs(options = {}) {
  try {
    const { defsFile } = _paths(options);
    _ensureDirs(options);
    if (!fs.existsSync(defsFile)) return [];
    return JSON.parse(fs.readFileSync(defsFile, 'utf8'));
  } catch { return []; }
}

function _writeDefs(defs, options = {}) {
  _ensureDirs(options);
  fs.writeFileSync(_paths(options).defsFile, JSON.stringify(defs, null, 2), 'utf8');
}

// ── Definitions ──────────────────────────────────────────────────────────────

function listWorkflows(options = {}) {
  return _readDefs(options);
}

function getWorkflow(id, options = {}) {
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) return null;
  return _readDefs(options).find(w => w.id === id) || null;
}

function saveWorkflow(wf, options = {}) {
  const workspaceId = _paths(options).workspaceId;
  const defs = _readDefs(options);
  const idx  = defs.findIndex(w => w.id === wf.id);
  const safe = { ...wf, workspaceId };
  if (idx >= 0) defs[idx] = safe;
  else defs.push(safe);
  _writeDefs(defs, options);
}

function deleteWorkflow(id, options = {}) {
  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) return false;
  const defs    = _readDefs(options);
  const filtered = defs.filter(w => w.id !== id);
  if (filtered.length === defs.length) return false;
  _writeDefs(filtered, options);
  return true;
}

// ── Runs ─────────────────────────────────────────────────────────────────────

function saveRun(runId, runData, options = {}) {
  if (!runId || !/^[a-zA-Z0-9_-]+$/.test(runId)) return;
  const { workspaceId, runsDir } = _paths(options);
  _ensureDirs(options);
  const safe = {
    runId,
    workspaceId,
    workflowId:      runData.workflowId,
    workflowName:    runData.workflowName,
    status:          runData.status,
    nodeResults:     runData.nodeResults || [],
    citations:       (runData.citations || []).slice(0, 20),
    rejectedActions: (runData.rejectedActions || []).slice(0, 20),
    safetySummary:   runData.safetySummary || null,
    summary:         runData.summary ? String(runData.summary).slice(0, 2000) : null,
    startedAt:       runData.startedAt,
    completedAt:     runData.completedAt || new Date().toISOString(),
    dryRun:          true,
  };
  fs.writeFileSync(path.join(runsDir, `${runId}.json`), JSON.stringify(safe, null, 2), 'utf8');
  _pruneRuns(options);
}

function listRuns(options = {}) {
  const { runsDir } = _paths(options);
  _ensureDirs(options);
  try {
    return fs.readdirSync(runsDir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(runsDir, f), 'utf8'));
          return { runId: data.runId, workspaceId: data.workspaceId, workflowId: data.workflowId, workflowName: data.workflowName, status: data.status, startedAt: data.startedAt, completedAt: data.completedAt };
        } catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''));
  } catch { return []; }
}

function getRun(runId, options = {}) {
  if (!runId || !/^[a-zA-Z0-9_-]+$/.test(runId)) return null;
  _ensureDirs(options);
  const file = path.join(_paths(options).runsDir, `${runId}.json`);
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch { return null; }
}

function clearRuns(options = {}) {
  const { runsDir } = _paths(options);
  _ensureDirs(options);
  const files = fs.readdirSync(runsDir).filter(f => f.endsWith('.json'));
  for (const f of files) {
    try { fs.unlinkSync(path.join(runsDir, f)); } catch { /* non bloquant */ }
  }
  return { cleared: files.length };
}

function _pruneRuns(options = {}) {
  try {
    const { runsDir } = _paths(options);
    const files = fs.readdirSync(runsDir).filter(f => f.endsWith('.json'));
    if (files.length <= MAX_RUNS) return;
    const sorted = files
      .map(f => ({ f, mtime: fs.statSync(path.join(runsDir, f)).mtimeMs }))
      .sort((a, b) => a.mtime - b.mtime);
    const toDelete = sorted.slice(0, files.length - MAX_RUNS);
    for (const { f } of toDelete) {
      try { fs.unlinkSync(path.join(runsDir, f)); } catch { /* non bloquant */ }
    }
  } catch { /* non bloquant */ }
}

// ── Export ────────────────────────────────────────────────────────────────────

function exportWorkflow(wf, options = {}) {
  _ensureDirs(options);
  const safe = {
    id:          wf.id,
    name:        wf.name,
    description: wf.description,
    version:     wf.version,
    localOnly:   true,
    dryRun:      true,
    nodes:       wf.nodes,
    edges:       wf.edges,
    triggers:    wf.triggers,
    exportedAt:  new Date().toISOString(),
    exportNote:  'Aucun secret inclus — importable dans Sallon-ConnecT.',
  };
  const file = path.join(_paths(options).exportsDir, `${wf.id}-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(safe, null, 2), 'utf8');
  return safe;
}

module.exports = {
  listWorkflows, getWorkflow, saveWorkflow, deleteWorkflow,
  saveRun, listRuns, getRun, clearRuns, exportWorkflow,
  _paths,
  WF_DIR, DEFS_FILE, RUNS_DIR, EXPORTS_DIR,
};
