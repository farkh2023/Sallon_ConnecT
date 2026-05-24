'use strict';

/**
 * aiMemory.test.js — Phase 49
 * Teste les endpoints memoire persistante IA + fonctions de securite.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockStore = new Map(); // must start with 'mock' for jest.mock() factories

jest.mock('../../server/src/ai/memory/memoryStore', () => ({
  listItems: jest.fn((filters = {}) => {
    let items = [...mockStore.values()];
    if (filters.type)  items = items.filter(i => i.type  === filters.type);
    if (filters.scope) items = items.filter(i => i.scope === filters.scope);
    return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }),
  getItem: jest.fn(id => mockStore.get(id) || null),
  createItem: jest.fn(item => {
    if (mockStore.has(item.id)) return { ok: false, error: 'id_deja_existant' };
    mockStore.set(item.id, item);
    return { ok: true, id: item.id };
  }),
  updateItem: jest.fn((id, updates) => {
    if (!mockStore.has(id)) return { ok: false, error: 'item_introuvable' };
    mockStore.set(id, { ...mockStore.get(id), ...updates });
    return { ok: true };
  }),
  deleteItem: jest.fn(id => {
    if (!mockStore.has(id)) return false;
    mockStore.delete(id);
    return true;
  }),
  clearItems: jest.fn(() => {
    const count = mockStore.size;
    mockStore.clear();
    return { cleared: count };
  }),
  getMeta: jest.fn(() => ({ totalItems: mockStore.size, byType: {}, byScope: {}, updatedAt: null })),
  getAllItems: jest.fn(() => [...mockStore.values()]),
}));

jest.mock('../../server/src/ai/memory/memoryRetriever', () => ({
  searchLexical: jest.fn((query) => {
    const results = [];
    for (const item of mockStore.values()) {
      if (item.content && item.content.toLowerCase().includes(query.toLowerCase())) {
        results.push({ ...item, _score: 2 });
      }
    }
    return results;
  }),
  searchWithEmbeddings: jest.fn(() => []),
}));

jest.mock('../../server/src/ai/memory/memorySummarizer', () => ({
  summarizeItems: jest.fn().mockResolvedValue({ summary: 'Resume test.', method: 'extractive' }),
}));

jest.mock('../../server/src/ai/memory/memoryExport', () => ({
  exportAll:   jest.fn(() => ({ ok: true, filename: 'memory-export-test.json', totalItems: mockStore.size })),
  importItems: jest.fn(payload => ({
    ok: true, imported: (payload.items || []).length, errors: [],
  })),
}));

jest.mock('../../server/src/ai/memory/memoryRetention', () => ({
  purgeExpired:      jest.fn(() => ({ purged: 0, reason: 'expired' })),
  purgeByAge:        jest.fn(() => ({ purged: 0, reason: 'age' })),
  purgeByType:       jest.fn(() => ({ purged: 0, reason: 'type' })),
  enforceMaxItems:   jest.fn(() => ({ purged: 0 })),
  getRetentionStatus: jest.fn(() => ({
    totalItems: mockStore.size, maxItems: 1000, retentionDays: 90, byType: {}, byScope: {},
  })),
}));

jest.mock('../../server/src/services/serverEventBus', () => ({
  publish: jest.fn(),
}));

// ── App setup ─────────────────────────────────────────────────────────────────

const request = require('supertest');
const express = require('express');

function buildApp(env = {}) {
  process.env = { ...process.env, ...env };
  jest.resetModules();
  const app    = express();
  app.use(express.json());
  const router = require('../../server/src/routes/aiMemory');
  app.use('/api/ai/memory', router);
  return app;
}

let app;
beforeAll(() => {
  process.env.SALLON_AI_MEMORY_ENABLED = 'true';
  app = buildApp({ SALLON_AI_MEMORY_ENABLED: 'true' });
});

beforeEach(() => {
  mockStore.clear();
  jest.clearAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/ai/memory/status', () => {
  it('retourne le statut de la memoire', async () => {
    const res = await request(app).get('/api/ai/memory/status').expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.safety).toBeDefined();
    expect(res.body.safety.localOnly).toBe(true);
    expect(res.body.retention).toBeDefined();
  });

  it('inclut le flag enabled', async () => {
    const res = await request(app).get('/api/ai/memory/status').expect(200);
    expect(typeof res.body.enabled).toBe('boolean');
  });
});

describe('GET /api/ai/memory', () => {
  it('retourne la liste vide initialement', async () => {
    const res = await request(app).get('/api/ai/memory').expect(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.safety.localOnly).toBe(true);
  });

  it('retourne les items apres creation', async () => {
    mockStore.set('mem_test1', {
      id: 'mem_test1', type: 'note', scope: 'user',
      content: 'Test note', tags: [], importance: 1,
      source: 'manual', createdAt: new Date().toISOString(),
      localOnly: true,
    });
    const res = await request(app).get('/api/ai/memory').expect(200);
    expect(res.body.total).toBe(1);
  });
});

describe('POST /api/ai/memory', () => {
  it('cree un item valide', async () => {
    const res = await request(app)
      .post('/api/ai/memory')
      .send({ type: 'note', scope: 'user', content: 'Test note', source: 'manual' })
      .expect(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.id).toBeDefined();
  });

  it('rejette un type invalide', async () => {
    await request(app)
      .post('/api/ai/memory')
      .send({ type: 'invalid-type', scope: 'user', content: 'Test', source: 'manual' })
      .expect(400);
  });

  it('rejette un scope invalide', async () => {
    await request(app)
      .post('/api/ai/memory')
      .send({ type: 'note', scope: 'invalid-scope', content: 'Test', source: 'manual' })
      .expect(400);
  });

  it('rejette un contenu vide', async () => {
    await request(app)
      .post('/api/ai/memory')
      .send({ type: 'note', scope: 'user', content: '', source: 'manual' })
      .expect(400);
  });

  it('retourne 503 si memoire desactivee', async () => {
    process.env.SALLON_AI_MEMORY_ENABLED = 'false';
    const appDisabled = buildApp({ SALLON_AI_MEMORY_ENABLED: 'false' });
    await request(appDisabled)
      .post('/api/ai/memory')
      .send({ type: 'note', scope: 'user', content: 'Test', source: 'manual' })
      .expect(503);
    process.env.SALLON_AI_MEMORY_ENABLED = 'true';
  });
});

describe('GET /api/ai/memory/:id', () => {
  it('retourne un item existant', async () => {
    mockStore.set('mem_abc', {
      id: 'mem_abc', type: 'fact', scope: 'project', content: 'Fait important',
      tags: ['test'], importance: 5, source: 'manual',
      createdAt: new Date().toISOString(), localOnly: true,
    });
    const res = await request(app).get('/api/ai/memory/mem_abc').expect(200);
    expect(res.body.id).toBe('mem_abc');
    expect(res.body.type).toBe('fact');
  });

  it('rejette un id invalide (caracteres speciaux)', async () => {
    await request(app).get('/api/ai/memory/bad!id').expect(400);
  });

  it('retourne 404 pour un id inconnu', async () => {
    await request(app).get('/api/ai/memory/unknown123').expect(404);
  });
});

describe('PUT /api/ai/memory/:id', () => {
  it('met a jour un item existant', async () => {
    mockStore.set('mem_upd', {
      id: 'mem_upd', type: 'note', scope: 'user', content: 'Ancien contenu',
      tags: [], importance: 1, source: 'manual', localOnly: true,
      createdAt: new Date().toISOString(),
    });
    const res = await request(app)
      .put('/api/ai/memory/mem_upd')
      .send({ type: 'note', scope: 'user', content: 'Nouveau contenu', source: 'manual' })
      .expect(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejette un id invalide', async () => {
    await request(app)
      .put('/api/ai/memory/bad!id')
      .send({ type: 'note', scope: 'user', content: 'Test', source: 'manual' })
      .expect(400);
  });
});

describe('DELETE /api/ai/memory/:id', () => {
  it('supprime un item existant', async () => {
    mockStore.set('mem_del', {
      id: 'mem_del', type: 'note', scope: 'user', content: 'A supprimer',
      tags: [], importance: 1, source: 'manual', localOnly: true,
      createdAt: new Date().toISOString(),
    });
    const res = await request(app).delete('/api/ai/memory/mem_del').expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.deleted).toBe(true);
  });

  it('retourne 404 si l\'item n\'existe pas', async () => {
    await request(app).delete('/api/ai/memory/nonexistent').expect(404);
  });

  it('rejette un id invalide', async () => {
    await request(app).delete('/api/ai/memory/bad!id').expect(400);
  });
});

describe('POST /api/ai/memory/search', () => {
  it('rejette une query vide', async () => {
    await request(app)
      .post('/api/ai/memory/search')
      .send({ query: '' })
      .expect(400);
  });

  it('retourne les resultats de recherche lexicale', async () => {
    mockStore.set('mem_s1', {
      id: 'mem_s1', type: 'note', scope: 'user',
      content: 'Le systeme est en bonne sante', tags: [],
      importance: 1, source: 'diagnostic', localOnly: true,
      createdAt: new Date().toISOString(),
    });
    const res = await request(app)
      .post('/api/ai/memory/search')
      .send({ query: 'sante', topK: 5 })
      .expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.results).toBeInstanceOf(Array);
    expect(res.body.query).toBe('sante');
  });
});

describe('POST /api/ai/memory/summarize', () => {
  it('retourne un resume vide si aucun item', async () => {
    const res = await request(app)
      .post('/api/ai/memory/summarize')
      .send({})
      .expect(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.method).toBe('empty');
  });

  it('retourne un resume des items', async () => {
    mockStore.set('mem_sum1', {
      id: 'mem_sum1', type: 'fact', scope: 'user',
      content: 'Le backup fonctionne correctement.',
      tags: [], importance: 3, source: 'diagnostic', localOnly: true,
      createdAt: new Date().toISOString(),
    });
    const res = await request(app)
      .post('/api/ai/memory/summarize')
      .send({ useAi: false })
      .expect(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.summary).toBe('string');
  });
});

describe('POST /api/ai/memory/export', () => {
  it('exporte la memoire sans erreur', async () => {
    const res = await request(app)
      .post('/api/ai/memory/export')
      .send({})
      .expect(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.filename).toBe('string');
  });
});

describe('POST /api/ai/memory/import', () => {
  it('rejette un payload sans items', async () => {
    await request(app)
      .post('/api/ai/memory/import')
      .send({ noItems: true })
      .expect(400);
  });

  it('importe des items valides', async () => {
    const res = await request(app)
      .post('/api/ai/memory/import')
      .send({
        items: [
          { id: 'mem_imp1', type: 'note', scope: 'user', content: 'Item importe', tags: [], source: 'manual', importance: 1, localOnly: true, createdAt: new Date().toISOString() },
        ],
      })
      .expect(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('POST /api/ai/memory/clear', () => {
  it('refuse sans confirmation', async () => {
    await request(app).post('/api/ai/memory/clear').send({}).expect(400);
  });

  it('refuse avec mauvaise confirmation', async () => {
    await request(app)
      .post('/api/ai/memory/clear')
      .send({ confirmation: 'OUI' })
      .expect(400);
  });

  it('efface la memoire avec bonne confirmation', async () => {
    mockStore.set('mem_clear1', { id: 'mem_clear1', type: 'note', scope: 'user', content: 'A supprimer', localOnly: true });
    const res = await request(app)
      .post('/api/ai/memory/clear')
      .send({ confirmation: 'EFFACER_MEMOIRE' })
      .expect(200);
    expect(res.body.ok).toBe(true);
    expect(typeof res.body.cleared).toBe('number');
  });
});

describe('maskSecretPatterns (securite)', () => {
  it('masque les tokens Bearer', () => {
    const { maskSecretPatterns } = require('../../server/src/ai/memory/memorySafety');
    const result = maskSecretPatterns('Authorization: Bearer abc123xyz');
    expect(result).toContain('[MASQUE]');
    expect(result).not.toContain('abc123xyz');
  });

  it('masque les mots de passe', () => {
    const { maskSecretPatterns } = require('../../server/src/ai/memory/memorySafety');
    const result = maskSecretPatterns('password=supersecret123');
    expect(result).toContain('[MASQUE]');
    expect(result).not.toContain('supersecret123');
  });

  it('retourne le texte intact si aucun secret', () => {
    const { maskSecretPatterns } = require('../../server/src/ai/memory/memorySafety');
    const text   = 'Le systeme fonctionne bien.';
    const result = maskSecretPatterns(text);
    expect(result).toBe(text);
  });
});

describe('validateMemoryItem (securite)', () => {
  it('valide un item correct', () => {
    const { validateMemoryItem } = require('../../server/src/ai/memory/memoryTypes');
    const result = validateMemoryItem({ type: 'note', scope: 'user', content: 'Test', source: 'manual', importance: 1 });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejette un type invalide', () => {
    const { validateMemoryItem } = require('../../server/src/ai/memory/memoryTypes');
    const result = validateMemoryItem({ type: 'invalid', scope: 'user', content: 'Test', source: 'manual' });
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /type/i.test(e))).toBe(true);
  });

  it('rejette un scope invalide', () => {
    const { validateMemoryItem } = require('../../server/src/ai/memory/memoryTypes');
    const result = validateMemoryItem({ type: 'note', scope: 'invalid', content: 'Test', source: 'manual' });
    expect(result.valid).toBe(false);
  });

  it('rejette un contenu manquant', () => {
    const { validateMemoryItem } = require('../../server/src/ai/memory/memoryTypes');
    const result = validateMemoryItem({ type: 'note', scope: 'user', source: 'manual' });
    expect(result.valid).toBe(false);
  });
});

describe('getMemorySafety', () => {
  it('retourne les flags attendus', () => {
    const { getMemorySafety } = require('../../server/src/ai/memory/memorySafety');
    const safety = getMemorySafety();
    expect(safety.localOnly).toBe(true);
    expect(safety.noCloudAllowed).toBe(true);
    expect(safety.secretMaskingEnabled).toBe(true);
    expect(Array.isArray(safety.memoryTypes)).toBe(true);
    expect(Array.isArray(safety.memoryScopes)).toBe(true);
  });
});
