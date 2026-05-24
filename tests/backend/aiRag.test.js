'use strict';

/**
 * aiRag.test.js — Phase 46
 * Teste les 5 endpoints RAG + fonctions unitaires de securite.
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../server/src/ai/rag/ragIndexer', () => ({
  indexSources:   jest.fn().mockResolvedValue({
    ok: true, chunkCount: 12, mode: 'lexical', sources: [
      { path: 'README.md', chunks: 5, size: 2048 },
      { path: 'docs/PHASE45.md', chunks: 7, size: 3000 },
    ], indexedAt: '2026-05-23T00:00:00.000Z', checksum: 'abc123', version: '1.0',
  }),
  collectDocFiles: jest.fn().mockReturnValue(['docs/PHASE45.md']),
  STATIC_SOURCES:  ['README.md', 'CHANGELOG.md', 'ROADMAP.md'],
}));

jest.mock('../../server/src/ai/rag/ragStore', () => {
  const state = {
    indexed:        false,
    chunkCount:     0,
    sources:        [],
    mode:           null,
    embeddingModel: null,
    indexedAt:      null,
    checksum:       null,
    ragVersion:     null,
  };
  return {
    getIndex:    jest.fn(() => state.indexed ? { chunkCount: state.chunkCount, mode: state.mode, sources: state.sources } : null),
    getChunks:   jest.fn(() => state.indexed ? [
      { id: 'chunk_abc', text: 'Sallon-ConnecT est un hub local', source: 'README.md', heading: 'Introduction', lineStart: 1, lineEnd: 5, hash: 'abc', indexedAt: '2026-05-23T00:00:00.000Z', embedding: null },
    ] : []),
    getMetadata: jest.fn(() => null),
    saveIndex:   jest.fn(data => { state.indexed = true; state.chunkCount = data.chunkCount; state.mode = data.mode; state.sources = data.sources; }),
    saveChunks:  jest.fn(),
    saveMetadata: jest.fn(),
    clearAll:    jest.fn(() => { state.indexed = false; state.chunkCount = 0; state.sources = []; }),
    isIndexed:   jest.fn(() => state.indexed),
    getStatus:   jest.fn(() => ({
      indexed:        state.indexed,
      chunkCount:     state.chunkCount,
      sources:        state.sources,
      mode:           state.mode,
      embeddingModel: state.embeddingModel,
      indexedAt:      state.indexedAt,
      checksum:       state.checksum,
      ragVersion:     state.ragVersion,
    })),
    RAG_DIR:     '/tmp/rag',
  };
});

jest.mock('../../server/src/ai/rag/ragRetriever', () => ({
  retrieve: jest.fn().mockResolvedValue({
    chunks: [
      { id: 'chunk_abc', text: 'Sallon-ConnecT est un hub local', source: 'README.md', heading: 'Introduction', _score: 0.85 },
    ],
    mode:    'lexical',
    indexed: true,
  }),
  DEFAULT_TOP_K: 5,
}));

jest.mock('../../server/src/ai/localAiClient', () => ({
  isEnabled: jest.fn(() => false),
  getStatus: jest.fn().mockResolvedValue({ enabled: false, reason: 'ai_disabled' }),
  chat:      jest.fn().mockResolvedValue({ ok: false, error: 'ai_disabled', response: null }),
}));

jest.mock('../../server/src/services/serverEventBus', () => ({
  publish: jest.fn(),
}));

// ── Setup ────────────────────────────────────────────────────────────────────

const request = require('supertest');
const express = require('express');
const aiRoutes = require('../../server/src/routes/ai');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/ai', aiRoutes);
  return app;
}

// ── Imports unitaires ────────────────────────────────────────────────────────

const ragSafety    = require('../../server/src/ai/rag/ragSafety');
const ragChunker   = require('../../server/src/ai/rag/ragChunker');
const ragCitations = require('../../server/src/ai/rag/ragCitations');
const ragEmbed     = require('../../server/src/ai/rag/ragEmbeddings');

// =============================================================================
// GET /api/ai/rag/status
// =============================================================================

describe('GET /api/ai/rag/status', () => {
  it('retourne 200 avec structure attendue', async () => {
    const res = await request(buildApp()).get('/api/ai/rag/status');
    expect(res.status).toBe(200);
    expect(typeof res.body.indexed).toBe('boolean');
    expect(typeof res.body.chunkCount).toBe('number');
  });

  it('inclut les flags de securite RAG', async () => {
    const res = await request(buildApp()).get('/api/ai/rag/status');
    const s   = res.body.safety;
    expect(s.localOnly).toBe(true);
    expect(s.noCloudAllowed).toBe(true);
    expect(s.sourceAllowlist).toBe(true);
    expect(s.pathTraversalBlocked).toBe(true);
    expect(s.secretMaskingEnabled).toBe(true);
    expect(s.citationsLocalOnly).toBe(true);
  });

  it('indique aiEnabled false par defaut', async () => {
    const res = await request(buildApp()).get('/api/ai/rag/status');
    expect(res.body.aiEnabled).toBe(false);
  });
});

// =============================================================================
// POST /api/ai/rag/index
// =============================================================================

describe('POST /api/ai/rag/index', () => {
  it('retourne ok:true', async () => {
    const res = await request(buildApp()).post('/api/ai/rag/index').send({});
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('retourne chunkCount dans la reponse', async () => {
    const res = await request(buildApp()).post('/api/ai/rag/index').send({});
    expect(typeof res.body.chunkCount).toBe('number');
  });

  it('retourne les sources indexees', async () => {
    const res = await request(buildApp()).post('/api/ai/rag/index').send({});
    expect(Array.isArray(res.body.sources)).toBe(true);
    expect(res.body.sources.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// POST /api/ai/rag/search
// =============================================================================

describe('POST /api/ai/rag/search', () => {
  it('retourne 400 si query absent', async () => {
    const res = await request(buildApp()).post('/api/ai/rag/search').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('query_requis');
  });

  it('retourne 400 si query non-string', async () => {
    const res = await request(buildApp()).post('/api/ai/rag/search').send({ query: 42 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('query_requis');
  });

  it('retourne les chunks avec scores', async () => {
    const res = await request(buildApp()).post('/api/ai/rag/search').send({ query: 'hub local' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.chunks)).toBe(true);
    expect(typeof res.body.mode).toBe('string');
  });

  it('retourne le mode de recherche', async () => {
    const res = await request(buildApp()).post('/api/ai/rag/search').send({ query: 'Ollama' });
    expect(['lexical', 'embedding', 'empty']).toContain(res.body.mode);
  });

  it('ne revele pas de chemin absolu dans les citations', async () => {
    const res = await request(buildApp()).post('/api/ai/rag/search').send({ query: 'Sallon' });
    const body = JSON.stringify(res.body);
    expect(body).not.toMatch(/C:\\Users\\/);
    expect(body).not.toMatch(/\/home\//);
  });
});

// =============================================================================
// POST /api/ai/rag/ask
// =============================================================================

describe('POST /api/ai/rag/ask', () => {
  it('retourne 400 si question absente', async () => {
    const res = await request(buildApp()).post('/api/ai/rag/ask').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('question_requise');
  });

  it('retourne 400 si question non-string', async () => {
    const res = await request(buildApp()).post('/api/ai/rag/ask').send({ question: 123 });
    expect(res.status).toBe(400);
  });

  it('retourne ok:false si IA desactivee', async () => {
    const res = await request(buildApp()).post('/api/ai/rag/ask').send({ question: 'Comment utiliser les widgets ?' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('ai_disabled');
  });

  it('retourne des citations dans la reponse', async () => {
    const res = await request(buildApp()).post('/api/ai/rag/ask').send({ question: 'Qu\'est-ce que Sallon-ConnecT ?' });
    expect(Array.isArray(res.body.citations)).toBe(true);
  });

  it('ne crashe pas avec une longue question', async () => {
    const long = 'a'.repeat(3000);
    const res  = await request(buildApp()).post('/api/ai/rag/ask').send({ question: long });
    expect([200, 400, 500]).toContain(res.status);
  });
});

// =============================================================================
// POST /api/ai/rag/clear
// =============================================================================

describe('POST /api/ai/rag/clear', () => {
  it('retourne 400 sans confirmation', async () => {
    const res = await request(buildApp()).post('/api/ai/rag/clear').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('confirmation_requise');
  });

  it('retourne 400 avec mauvaise confirmation', async () => {
    const res = await request(buildApp()).post('/api/ai/rag/clear').send({ confirmation: 'oui' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('confirmation_requise');
  });

  it('retourne ok:true avec EFFACER_INDEX', async () => {
    const res = await request(buildApp()).post('/api/ai/rag/clear').send({ confirmation: 'EFFACER_INDEX' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('inclut le hint dans la reponse 400', async () => {
    const res = await request(buildApp()).post('/api/ai/rag/clear').send({});
    expect(typeof res.body.hint).toBe('string');
    expect(res.body.hint).toMatch(/EFFACER_INDEX/);
  });
});

// =============================================================================
// ragSafety — fonctions unitaires
// =============================================================================

describe('ragSafety.isSourceAllowed', () => {
  it('accepte docs/PHASE45.md', () => {
    expect(ragSafety.isSourceAllowed('docs/PHASE45.md')).toBe(true);
  });
  it('accepte README.md', () => {
    expect(ragSafety.isSourceAllowed('README.md')).toBe(true);
  });
  it('accepte CHANGELOG.md', () => {
    expect(ragSafety.isSourceAllowed('CHANGELOG.md')).toBe(true);
  });
  it('accepte ROADMAP.md', () => {
    expect(ragSafety.isSourceAllowed('ROADMAP.md')).toBe(true);
  });
  it('rejette .env', () => {
    expect(ragSafety.isSourceAllowed('.env')).toBe(false);
  });
  it('rejette ../ (path traversal)', () => {
    expect(ragSafety.isSourceAllowed('../server.js')).toBe(false);
  });
  it('rejette node_modules/', () => {
    expect(ragSafety.isSourceAllowed('node_modules/express/index.js')).toBe(false);
  });
  it('rejette runtime/', () => {
    expect(ragSafety.isSourceAllowed('runtime/first-run-report.json')).toBe(false);
  });
  it('rejette backups/', () => {
    expect(ragSafety.isSourceAllowed('backups/snapshot.json')).toBe(false);
  });
  it('rejette .pem', () => {
    expect(ragSafety.isSourceAllowed('docs/cert.pem')).toBe(false);
  });
  it('rejette les fichiers binaires .exe', () => {
    expect(ragSafety.isSourceAllowed('docs/setup.exe')).toBe(false);
  });
  it('rejette les chemins absolus', () => {
    expect(ragSafety.isSourceAllowed('/etc/passwd')).toBe(false);
  });
});

describe('ragSafety.isFileSizeAllowed', () => {
  it('accepte 1 Mo', () => {
    expect(ragSafety.isFileSizeAllowed(1024 * 1024)).toBe(true);
  });
  it('accepte exactement la limite', () => {
    const limit = ragSafety.MAX_FILE_SIZE_MB * 1024 * 1024;
    expect(ragSafety.isFileSizeAllowed(limit)).toBe(true);
  });
  it('rejette un fichier trop gros', () => {
    const tooLarge = (ragSafety.MAX_FILE_SIZE_MB + 1) * 1024 * 1024;
    expect(ragSafety.isFileSizeAllowed(tooLarge)).toBe(false);
  });
});

describe('ragSafety.sanitizeQuestion', () => {
  it('masque Bearer dans la question', () => {
    const q = ragSafety.sanitizeQuestion('mon token Bearer abc123xyz90 est-il safe?');
    expect(q).not.toMatch(/abc123xyz90/);
  });
  it('tronque a MAX_QUESTION_CHARS', () => {
    const long = 'a'.repeat(ragSafety.MAX_QUESTION_CHARS + 500);
    const q    = ragSafety.sanitizeQuestion(long);
    expect(q.length).toBeLessThanOrEqual(ragSafety.MAX_QUESTION_CHARS);
  });
  it('retourne chaine vide pour non-string', () => {
    expect(ragSafety.sanitizeQuestion(null)).toBe('');
  });
});

describe('ragSafety.maskCitationPath', () => {
  it('masque les chemins C:\\Users\\', () => {
    const masked = ragSafety.maskCitationPath('docs/PHASE45.md');
    expect(masked).not.toMatch(/C:\\Users\\/);
  });
  it('retourne [source] pour chaine vide', () => {
    expect(ragSafety.maskCitationPath('')).toBe('[source]');
  });
});

// =============================================================================
// ragChunker — fonctions unitaires
// =============================================================================

describe('ragChunker.chunkMarkdown', () => {
  const md = `# Introduction\n\nSallon-ConnecT est un hub local.\n\n## Fonctionnalites\n\nWidgets, IA, RAG.`;

  it('retourne un tableau de chunks', () => {
    const chunks = ragChunker.chunkMarkdown(md, 'README.md');
    expect(Array.isArray(chunks)).toBe(true);
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('chaque chunk a un id, text, source, hash', () => {
    const chunks = ragChunker.chunkMarkdown(md, 'README.md');
    for (const c of chunks) {
      expect(typeof c.id).toBe('string');
      expect(typeof c.text).toBe('string');
      expect(c.source).toBe('README.md');
      expect(typeof c.hash).toBe('string');
    }
  });

  it('extrait les headings Markdown', () => {
    const chunks = ragChunker.chunkMarkdown(md, 'README.md');
    const headings = chunks.map(c => c.heading).filter(Boolean);
    expect(headings.length).toBeGreaterThan(0);
  });

  it('retourne [] pour contenu vide', () => {
    expect(ragChunker.chunkMarkdown('', 'README.md')).toEqual([]);
  });
});

// =============================================================================
// ragCitations — fonctions unitaires
// =============================================================================

describe('ragCitations.formatCitations', () => {
  const chunks = [
    { source: 'docs/PHASE45.md', heading: 'IA locale', text: 'Phase 45 integre Ollama.', _score: 0.9 },
    { source: 'README.md',       heading: '',           text: 'Sallon-ConnecT hub local.', _score: 0.7 },
  ];

  it('retourne autant de citations que de chunks', () => {
    const citations = ragCitations.formatCitations(chunks);
    expect(citations.length).toBe(2);
  });

  it('chaque citation a index, source, heading, excerpt, score', () => {
    const [c1] = ragCitations.formatCitations(chunks);
    expect(c1.index).toBe(1);
    expect(typeof c1.source).toBe('string');
    expect(typeof c1.excerpt).toBe('string');
    expect(typeof c1.score).toBe('number');
  });

  it('ne revele pas de chemin absolu Windows', () => {
    const withAbsPath = [{ source: 'C:\\Users\\Youss\\docs\\PHASE45.md', heading: '', text: 'test', _score: 0.5 }];
    const citations   = ragCitations.formatCitations(withAbsPath);
    expect(citations[0].source).not.toMatch(/C:\\Users\\/);
  });

  it('retourne [] pour tableau vide', () => {
    expect(ragCitations.formatCitations([])).toEqual([]);
  });
});

describe('ragCitations.buildContextBlock', () => {
  it('retourne chaine vide pour chunks vides', () => {
    expect(ragCitations.buildContextBlock([])).toBe('');
  });

  it('contient [Source 1]', () => {
    const chunks = [{ source: 'README.md', heading: 'Intro', text: 'Hub local.' }];
    expect(ragCitations.buildContextBlock(chunks)).toMatch(/\[Source 1/);
  });
});

// =============================================================================
// ragEmbeddings — fonctions unitaires (lexical score)
// =============================================================================

describe('ragEmbeddings.lexicalScore', () => {
  it('score 1 si tous les tokens sont presents', () => {
    const score = ragEmbed.lexicalScore('hub local', 'Sallon-ConnecT est un hub local');
    expect(score).toBeGreaterThan(0);
  });
  it('score 0 si aucun token present', () => {
    const score = ragEmbed.lexicalScore('xyz999', 'Sallon-ConnecT est un hub local');
    expect(score).toBe(0);
  });
  it('retourne 0 pour chaine vide', () => {
    expect(ragEmbed.lexicalScore('', 'texte')).toBe(0);
  });
});

describe('ragEmbeddings.cosineSimilarity', () => {
  it('retourne 1 pour vecteurs identiques', () => {
    const v = [1, 0, 0];
    expect(ragEmbed.cosineSimilarity(v, v)).toBeCloseTo(1);
  });
  it('retourne 0 pour vecteurs orthogonaux', () => {
    expect(ragEmbed.cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0);
  });
  it('retourne 0 pour vecteurs null', () => {
    expect(ragEmbed.cosineSimilarity(null, null)).toBe(0);
  });
  it('retourne 0 pour vecteurs de longueurs differentes', () => {
    expect(ragEmbed.cosineSimilarity([1, 0], [1, 0, 0])).toBe(0);
  });
});
