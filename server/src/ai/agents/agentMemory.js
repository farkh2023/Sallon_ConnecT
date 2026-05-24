'use strict';

const fs   = require('fs');
const path = require('path');
const workspaceContext = require('../../workspaces/workspaceContext');

const AGENTS_DIR  = path.join(process.cwd(), 'runtime', 'agents');
const MEMORY_FILE = path.join(AGENTS_DIR, 'memory.json');
const RUNS_DIR    = path.join(AGENTS_DIR, 'runs');

function _paths(options = {}) {
  const ctx = workspaceContext.getContextPaths(options.workspaceId);
  return {
    workspaceId: ctx.workspaceId,
    agentsDir:  ctx.agents,
    memoryFile: path.join(ctx.agents, 'memory.json'),
    runsDir:    ctx.agentRuns,
  };
}

function _ensureDirs(options = {}) {
  const { agentsDir, runsDir } = _paths(options);
  if (!fs.existsSync(agentsDir)) fs.mkdirSync(agentsDir, { recursive: true });
  if (!fs.existsSync(runsDir))   fs.mkdirSync(runsDir,   { recursive: true });
}

function _readMemory(options = {}) {
  try {
    const { memoryFile } = _paths(options);
    _ensureDirs(options);
    if (!fs.existsSync(memoryFile)) return { runs: [], lastUpdated: null };
    return JSON.parse(fs.readFileSync(memoryFile, 'utf8'));
  } catch { return { runs: [], lastUpdated: null }; }
}

function saveRun(runId, runData, options = {}) {
  const { workspaceId, memoryFile, runsDir } = _paths(options);
  _ensureDirs(options);
  // Donnees persitees : pas de secrets, pas de chemins absolus utilisateur
  const safe = {
    runId,
    workspaceId,
    status:       runData.status,
    task:         runData.task ? String(runData.task).slice(0, 500) : '',
    agentsUsed:   runData.agentsUsed || [],
    steps:        (runData.steps || []).map(s => ({
      agentId: s.agentId,
      toolsUsed: (s.steps || []).map(t => t.tool),
      ok: s.ok,
    })),
    recommendations: (runData.recommendations || []).slice(0, 20),
    citations:    (runData.citations || []).slice(0, 10),
    rejectedActions: (runData.rejectedActions || []).slice(0, 10),
    safetySummary: runData.safetySummary || null,
    startedAt:    runData.startedAt,
    completedAt:  runData.completedAt || new Date().toISOString(),
    dryRun:       true,
  };

  const runFile = path.join(runsDir, `${runId}.json`);
  fs.writeFileSync(runFile, JSON.stringify(safe, null, 2), 'utf8');

  // Mettre a jour l'index memoire
  const mem = _readMemory(options);
  const existing = mem.runs.findIndex(r => r.runId === runId);
  const summary = {
    runId,
    workspaceId,
    task:        safe.task,
    agentsUsed:  safe.agentsUsed,
    status:      safe.status,
    startedAt:   safe.startedAt,
    completedAt: safe.completedAt,
  };
  if (existing >= 0) mem.runs[existing] = summary;
  else mem.runs.unshift(summary);

  // Garder seulement les 50 derniers runs en index
  mem.runs = mem.runs.slice(0, 50);
  mem.lastUpdated = new Date().toISOString();
  fs.writeFileSync(memoryFile, JSON.stringify(mem, null, 2), 'utf8');
}

function listRuns(options = {}) {
  return _readMemory(options).runs;
}

function getRun(runId, options = {}) {
  if (!runId || typeof runId !== 'string') return null;
  // Validation ID : lettres, chiffres, tiret, underscore uniquement
  if (!/^[a-zA-Z0-9_-]+$/.test(runId)) return null;
  const runFile = path.join(_paths(options).runsDir, `${runId}.json`);
  try {
    if (!fs.existsSync(runFile)) return null;
    return JSON.parse(fs.readFileSync(runFile, 'utf8'));
  } catch { return null; }
}

function clearRuns(options = {}) {
  const { memoryFile, runsDir } = _paths(options);
  _ensureDirs(options);
  const files = fs.readdirSync(runsDir).filter(f => f.endsWith('.json'));
  for (const f of files) {
    try { fs.unlinkSync(path.join(runsDir, f)); } catch { /* non bloquant */ }
  }
  fs.writeFileSync(memoryFile, JSON.stringify({ runs: [], lastUpdated: new Date().toISOString() }, null, 2), 'utf8');
  return { cleared: files.length };
}

module.exports = { saveRun, listRuns, getRun, clearRuns, _paths, AGENTS_DIR, MEMORY_FILE, RUNS_DIR };
