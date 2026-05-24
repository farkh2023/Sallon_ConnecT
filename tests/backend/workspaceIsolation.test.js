'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const request = require('supertest');

const ROOT = process.cwd();
let tempRoot;
let counter = 0;

function makeTempRoot() {
  counter += 1;
  return path.join(ROOT, 'tests', '.runtime', `workspace-isolation-${Date.now()}-${counter}`);
}

function setupRuntime() {
  tempRoot = makeTempRoot();
  fs.mkdirSync(tempRoot, { recursive: true });
  process.chdir(tempRoot);
  process.env.SALLON_WORKSPACES_ENABLED = 'true';
  process.env.SALLON_DEFAULT_WORKSPACE = 'default';
  process.env.SALLON_WORKSPACE_MAX_COUNT = '20';
  process.env.SALLON_WORKSPACE_LEGACY_FALLBACK = 'true';
  process.env.SALLON_WORKSPACE_MIGRATION_AUTO = 'false';
  jest.resetModules();
  const store = require('../../server/src/workspaces/workspaceStore');
  store.init();
  store.createProfile({ id: 'ws_alpha', name: 'Alpha', localOnly: true });
  store.createProfile({ id: 'ws_beta', name: 'Beta', localOnly: true });
  return store;
}

afterEach(() => {
  process.chdir(ROOT);
  jest.resetModules();
  if (tempRoot && fs.existsSync(tempRoot)) fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe('workspace isolation Phase 53', () => {
  it('isole les index RAG entre workspaces A/B', async () => {
    setupRuntime();
    const ragStore = require('../../server/src/ai/rag/ragStore');
    const { retrieve } = require('../../server/src/ai/rag/ragRetriever');

    ragStore.saveIndex({ version: '1.0', chunkCount: 1, mode: 'lexical', sources: [], indexedAt: '2026-05-24T00:00:00.000Z' }, { workspaceId: 'ws_alpha' });
    ragStore.saveChunks([{ id: 'a1', text: 'alpha-only rag content', source: 'docs/a.md', heading: 'A', hash: 'a' }], { workspaceId: 'ws_alpha' });
    ragStore.saveIndex({ version: '1.0', chunkCount: 1, mode: 'lexical', sources: [], indexedAt: '2026-05-24T00:00:00.000Z' }, { workspaceId: 'ws_beta' });
    ragStore.saveChunks([{ id: 'b1', text: 'beta-only rag content', source: 'docs/b.md', heading: 'B', hash: 'b' }], { workspaceId: 'ws_beta' });

    const alpha = await retrieve('alpha-only', { workspaceId: 'ws_alpha', topK: 5 });
    const beta = await retrieve('beta-only', { workspaceId: 'ws_beta', topK: 5 });

    expect(JSON.stringify(alpha)).toContain('alpha-only');
    expect(JSON.stringify(alpha)).not.toContain('beta-only');
    expect(JSON.stringify(beta)).toContain('beta-only');
    expect(JSON.stringify(beta)).not.toContain('alpha-only');
  });

  it('isole la Knowledge Base entre workspaces A/B', () => {
    setupRuntime();
    const store = require('../../server/src/ai/knowledge/knowledgeStore');
    const retriever = require('../../server/src/ai/knowledge/knowledgeRetriever');

    store.createItem({ id: 'kb_alpha', type: 'note', title: 'Alpha KB', content: 'alpha-only knowledge', localOnly: true }, { workspaceId: 'ws_alpha' });
    store.createItem({ id: 'kb_beta', type: 'note', title: 'Beta KB', content: 'beta-only knowledge', localOnly: true }, { workspaceId: 'ws_beta' });

    const alpha = retriever.searchLexical('alpha-only', {}, 10, { workspaceId: 'ws_alpha' });
    const beta = retriever.searchLexical('beta-only', {}, 10, { workspaceId: 'ws_beta' });

    expect(alpha.map(i => i.id)).toEqual(['kb_alpha']);
    expect(beta.map(i => i.id)).toEqual(['kb_beta']);
  });

  it('isole les runs agents entre workspaces A/B', () => {
    setupRuntime();
    const agentMemory = require('../../server/src/ai/agents/agentMemory');

    agentMemory.saveRun('agent_alpha', { status: 'completed', task: 'alpha task', startedAt: '2026-05-24T00:00:00.000Z' }, { workspaceId: 'ws_alpha' });
    agentMemory.saveRun('agent_beta', { status: 'completed', task: 'beta task', startedAt: '2026-05-24T00:00:00.000Z' }, { workspaceId: 'ws_beta' });

    expect(agentMemory.listRuns({ workspaceId: 'ws_alpha' }).map(r => r.runId)).toEqual(['agent_alpha']);
    expect(agentMemory.listRuns({ workspaceId: 'ws_beta' }).map(r => r.runId)).toEqual(['agent_beta']);
    expect(agentMemory.getRun('agent_beta', { workspaceId: 'ws_alpha' })).toBeNull();
  });

  it('isole les definitions et runs workflows entre workspaces A/B', () => {
    setupRuntime();
    const workflows = require('../../server/src/ai/workflows/workflowStore');

    workflows.saveWorkflow({ id: 'wf_alpha', name: 'Alpha WF', nodes: [], edges: [], localOnly: true, dryRun: true }, { workspaceId: 'ws_alpha' });
    workflows.saveWorkflow({ id: 'wf_beta', name: 'Beta WF', nodes: [], edges: [], localOnly: true, dryRun: true }, { workspaceId: 'ws_beta' });
    workflows.saveRun('run_alpha', { workflowId: 'wf_alpha', workflowName: 'Alpha WF', status: 'completed', startedAt: '2026-05-24T00:00:00.000Z' }, { workspaceId: 'ws_alpha' });
    workflows.saveRun('run_beta', { workflowId: 'wf_beta', workflowName: 'Beta WF', status: 'completed', startedAt: '2026-05-24T00:00:00.000Z' }, { workspaceId: 'ws_beta' });

    expect(workflows.listWorkflows({ workspaceId: 'ws_alpha' }).map(w => w.id)).toEqual(['wf_alpha']);
    expect(workflows.listWorkflows({ workspaceId: 'ws_beta' }).map(w => w.id)).toEqual(['wf_beta']);
    expect(workflows.listRuns({ workspaceId: 'ws_alpha' }).map(r => r.runId)).toEqual(['run_alpha']);
    expect(workflows.getRun('run_beta', { workspaceId: 'ws_alpha' })).toBeNull();
  });

  it('exporte un workspace complet sans donnees du workspace voisin ni secret', () => {
    setupRuntime();
    const ragStore = require('../../server/src/ai/rag/ragStore');
    const kbStore = require('../../server/src/ai/knowledge/knowledgeStore');
    const agents = require('../../server/src/ai/agents/agentMemory');
    const workflows = require('../../server/src/ai/workflows/workflowStore');
    const { exportWorkspace } = require('../../server/src/workspaces/workspaceExport');

    ragStore.saveChunks([{ id: 'a1', text: 'alpha export data', source: 'docs/a.md', hash: 'a' }], { workspaceId: 'ws_alpha' });
    ragStore.saveChunks([{ id: 'b1', text: 'beta export data', source: 'docs/b.md', hash: 'b' }], { workspaceId: 'ws_beta' });
    kbStore.createItem({ id: 'kb_alpha', type: 'note', title: 'Alpha', content: 'apiKey=secret-alpha', localOnly: true }, { workspaceId: 'ws_alpha' });
    agents.saveRun('agent_alpha', { status: 'completed', task: 'alpha agent', startedAt: '2026-05-24T00:00:00.000Z' }, { workspaceId: 'ws_alpha' });
    workflows.saveWorkflow({ id: 'wf_alpha', name: 'Alpha WF', nodes: [], edges: [], localOnly: true, dryRun: true }, { workspaceId: 'ws_alpha' });

    const exported = exportWorkspace('ws_alpha');
    const raw = fs.readFileSync(path.join(tempRoot, 'runtime', 'workspaces', 'exports', exported.filename), 'utf8');

    expect(raw).toContain('alpha export data');
    expect(raw).toContain('wf_alpha');
    expect(raw).not.toContain('beta export data');
    expect(raw).not.toContain('secret-alpha');
    expect(raw).not.toContain(tempRoot);
    expect(exported.checksum).toMatch(/^[a-f0-9]{64}$/);
  });

  it('importe un workspace complet valide', () => {
    setupRuntime();
    const { importWorkspace } = require('../../server/src/workspaces/workspaceExport');
    const ragStore = require('../../server/src/ai/rag/ragStore');
    const workflows = require('../../server/src/ai/workflows/workflowStore');

    importWorkspace({
      version: '2.0',
      localOnly: true,
      profile: { id: 'ws_imported', name: 'Imported', description: '', localOnly: true },
      settings: { theme: 'system', language: 'fr' },
      data: {
        rag: { chunks: [{ id: 'imp1', text: 'imported rag data', source: 'docs/import.md', hash: 'imp' }] },
        workflows: { definitions: [{ id: 'wf_imported', name: 'Imported WF', nodes: [], edges: [], localOnly: true, dryRun: true }], runs: [] },
        agents: { runs: [] },
        knowledge: { items: [] },
        dashboards: { files: [] },
        commandHistory: { files: [] },
      },
    });

    expect(ragStore.getChunks({ workspaceId: 'ws_imported' })[0].text).toBe('imported rag data');
    expect(workflows.getWorkflow('wf_imported', { workspaceId: 'ws_imported' }).name).toBe('Imported WF');
  });

  it('conserve la compatibilite legacy du workspace default', () => {
    setupRuntime();
    const legacyRag = path.join(tempRoot, 'runtime', 'rag');
    fs.mkdirSync(legacyRag, { recursive: true });
    fs.writeFileSync(path.join(legacyRag, 'chunks.json'), JSON.stringify([{ id: 'legacy', text: 'legacy default rag' }]), 'utf8');

    const ragStore = require('../../server/src/ai/rag/ragStore');
    const chunks = ragStore.getChunks({ workspaceId: 'default' });

    expect(chunks[0].text).toBe('legacy default rag');
  });

  it('refuse les workspaceId invalides et bloque le path traversal', async () => {
    setupRuntime();
    const app = express();
    app.use(express.json());
    app.use('/api/ai/rag', require('../../server/src/routes/aiRag'));

    await request(app).post('/api/ai/rag/search').send({ workspaceId: '../bad', query: 'x' }).expect(400);
    expect(() => require('../../server/src/workspaces/workspaceContext').getRagPath('../bad')).toThrow(/id_invalide/);
  });
});
