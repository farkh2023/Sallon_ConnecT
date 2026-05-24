'use strict';

const express    = require('express');
const request    = require('supertest');

// ── mocks ──────────────────────────────────────────────────────────────────────

const mockItems = new Map();

jest.mock('../../server/src/ai/knowledge/knowledgeStore', () => ({
  listItems:     jest.fn((filters = {}) => {
    const all = [...mockItems.values()];
    return all.filter(i => {
      if (filters.type && i.type !== filters.type) return false;
      return true;
    });
  }),
  getItem:       jest.fn(id => mockItems.get(id) || null),
  createItem:    jest.fn(item => { mockItems.set(item.id, item); return item; }),
  updateItem:    jest.fn((id, updates) => {
    const existing = mockItems.get(id);
    if (!existing) return null;
    const merged = { ...existing, ...updates };
    mockItems.set(id, merged);
    return merged;
  }),
  deleteItem:    jest.fn(id => { const existed = mockItems.has(id); mockItems.delete(id); return existed; }),
  clearItems:    jest.fn(() => { mockItems.clear(); }),
  getMeta:       jest.fn(() => ({ totalItems: mockItems.size, byType: {}, bySource: {}, updatedAt: null })),
  getAllItems:    jest.fn(() => [...mockItems.values()]),
  invalidateCache: jest.fn(),
}));

jest.mock('../../server/src/ai/knowledge/knowledgeIndexer', () => ({
  rebuildIndex:    jest.fn(() => new Map()),
  invalidateIndex: jest.fn(),
  indexItem:       jest.fn(),
  enrichWithEntities: jest.fn(item => item),
  buildTokens:     jest.fn(t => (t || '').toLowerCase().split(/\W+/).filter(Boolean)),
  getIndex:        jest.fn(() => new Map()),
}));

jest.mock('../../server/src/ai/knowledge/knowledgeRetriever', () => ({
  searchLexical:       jest.fn((q) => q === 'erreur' ? Promise.reject(new Error('search_fail')) : Promise.resolve([{ id: 'kb_test1', type: 'note', title: 'Test', _score: 2 }])),
  searchWithEmbeddings: jest.fn((q) => q === 'erreur' ? Promise.reject(new Error('search_fail')) : Promise.resolve([{ id: 'kb_test1', type: 'note', title: 'Test', _score: 2 }])),
}));

jest.mock('../../server/src/ai/knowledge/knowledgeGraph', () => ({
  buildGraph:   jest.fn(() => ({ nodes: [], edges: [], totalNodes: 0, totalEdges: 0, generatedAt: new Date().toISOString() })),
  linkEntities: jest.fn(() => ({ linked: 0, relations: [] })),
  getNeighbours: jest.fn(() => []),
}));

jest.mock('../../server/src/ai/knowledge/knowledgeSummaries', () => ({
  summarizeCategory: jest.fn(cat => Promise.resolve({ category: cat, summary: `Resume de ${cat}`, method: 'extractive', items: 1 })),
  summarizeAll:      jest.fn(() => Promise.resolve({ project: { category: 'project', summary: 'Resume global', method: 'extractive', items: 0 } })),
}));

jest.mock('../../server/src/ai/knowledge/knowledgeSafety', () => ({
  getKnowledgeSafety: jest.fn(() => ({ localOnly: true, noCloudAllowed: true, secretMaskingEnabled: true, pathTraversalBlocked: true, clearRequiresConfirmation: true, importExportDisabled: true })),
  sanitizeKbItem:     jest.fn(item => item),
  sanitizeForCitation: jest.fn(item => item),
  validateId:         jest.fn(id => /^[a-zA-Z0-9_-]+$/.test(id)),
  maskSecrets:        jest.fn(t => t),
}));

jest.mock('../../server/src/ai/knowledge/knowledgeTypes', () => ({
  validateKbItem: jest.fn(item => ({ valid: true, errors: [] })),
  DEFAULT_TOPK:   jest.fn(() => 8),
  MAX_ITEMS:      jest.fn(() => 10000),
  KB_ITEM_TYPES:  new Set(['memory','rag','workflow','agent','diagnostic','plugin','event','note']),
  KB_RELATION_TYPES: new Set(['related-to','derived-from','referenced-by','causes','solves','extends','summarizes']),
  MAX_CONTENT: 8000, MAX_TITLE: 300, MAX_ENTITIES: 20, MAX_TAGS: 30,
}));

// ── app builder ────────────────────────────────────────────────────────────────

function buildApp(envOverrides = {}) {
  const savedEnv = {};
  for (const [k, v] of Object.entries(envOverrides)) {
    savedEnv[k] = process.env[k];
    process.env[k] = v;
  }

  const app    = express();
  app.use(express.json());
  const router = require('../../server/src/routes/aiKnowledge');
  app.use('/api/ai/knowledge', router);

  for (const k of Object.keys(envOverrides)) {
    process.env[k] = savedEnv[k];
  }
  return app;
}

// ── tests ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockItems.clear();
  jest.clearAllMocks();
});

describe('GET /api/ai/knowledge/status', () => {
  it('retourne le statut', async () => {
    const res = await request(buildApp()).get('/api/ai/knowledge/status');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.safety.localOnly).toBe(true);
  });
});

describe('GET /api/ai/knowledge', () => {
  it('retourne la liste des items', async () => {
    const res = await request(buildApp()).get('/api/ai/knowledge');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('filtre par type', async () => {
    const res = await request(buildApp()).get('/api/ai/knowledge?type=note');
    expect(res.status).toBe(200);
  });
});

describe('POST /api/ai/knowledge/search', () => {
  it('recherche et retourne des resultats', async () => {
    const res = await request(buildApp())
      .post('/api/ai/knowledge/search')
      .send({ query: 'workflow' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.results)).toBe(true);
  });

  it('retourne 400 sans query', async () => {
    const res = await request(buildApp())
      .post('/api/ai/knowledge/search')
      .send({});
    expect(res.status).toBe(400);
  });

  it('ne fait aucun appel cloud', async () => {
    const { searchWithEmbeddings } = require('../../server/src/ai/knowledge/knowledgeRetriever');
    await request(buildApp()).post('/api/ai/knowledge/search').send({ query: 'test' });
    expect(searchWithEmbeddings).toHaveBeenCalledWith('test', {}, 8);
  });
});

describe('POST /api/ai/knowledge/graph', () => {
  it('retourne le graphe', async () => {
    const res = await request(buildApp())
      .post('/api/ai/knowledge/graph')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.nodes)).toBe(true);
    expect(Array.isArray(res.body.edges)).toBe(true);
  });
});

describe('POST /api/ai/knowledge/summarize', () => {
  it('resume une categorie', async () => {
    const res = await request(buildApp())
      .post('/api/ai/knowledge/summarize')
      .send({ category: 'agents' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.category).toBe('agents');
  });

  it('resume tout sans categorie', async () => {
    const res = await request(buildApp())
      .post('/api/ai/knowledge/summarize')
      .send({});
    expect(res.status).toBe(200);
    expect(res.body.summaries).toBeDefined();
  });
});

describe('POST /api/ai/knowledge/reindex', () => {
  it('reindexe quand active', async () => {
    const old = process.env.SALLON_KNOWLEDGE_ENABLED;
    process.env.SALLON_KNOWLEDGE_ENABLED = 'true';
    const res = await request(buildApp()).post('/api/ai/knowledge/reindex');
    process.env.SALLON_KNOWLEDGE_ENABLED = old;
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('bloque si desactive', async () => {
    const old = process.env.SALLON_KNOWLEDGE_ENABLED;
    process.env.SALLON_KNOWLEDGE_ENABLED = 'false';
    const res = await request(buildApp()).post('/api/ai/knowledge/reindex');
    process.env.SALLON_KNOWLEDGE_ENABLED = old;
    expect(res.status).toBe(503);
  });
});

describe('POST /api/ai/knowledge/clear', () => {
  it('efface avec confirmation correcte', async () => {
    const res = await request(buildApp())
      .post('/api/ai/knowledge/clear')
      .send({ confirmation: 'EFFACER_KNOWLEDGE_BASE' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('refuse sans confirmation', async () => {
    const res = await request(buildApp())
      .post('/api/ai/knowledge/clear')
      .send({ confirmation: 'oui' });
    expect(res.status).toBe(400);
  });

  it('refuse sans corps', async () => {
    const res = await request(buildApp())
      .post('/api/ai/knowledge/clear')
      .send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/ai/knowledge/:id', () => {
  it('retourne un item existant', async () => {
    mockItems.set('kb_abc123', { id: 'kb_abc123', type: 'note', title: 'Test', content: 'Contenu' });
    const res = await request(buildApp()).get('/api/ai/knowledge/kb_abc123');
    expect(res.status).toBe(200);
    expect(res.body.item.id).toBe('kb_abc123');
  });

  it('retourne 404 si introuvable', async () => {
    const res = await request(buildApp()).get('/api/ai/knowledge/kb_inexistant');
    expect(res.status).toBe(404);
  });

  it('bloque path traversal', async () => {
    const { validateId } = require('../../server/src/ai/knowledge/knowledgeSafety');
    validateId.mockReturnValueOnce(false);
    const res = await request(buildApp()).get('/api/ai/knowledge/kb_..%2Fetc%2Fpasswd');
    expect(res.status).toBe(400);
  });
});

describe('citations et secrets', () => {
  it('recherche retourne des citations sans chemins sensibles', async () => {
    const res = await request(buildApp())
      .post('/api/ai/knowledge/search')
      .send({ query: 'test' });
    expect(res.status).toBe(200);
    const text = JSON.stringify(res.body);
    expect(text).not.toContain('C:\\Users\\');
    expect(text).not.toContain('/home/');
  });
});
