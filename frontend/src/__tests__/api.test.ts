import { describe, expect, it, vi, afterEach } from 'vitest';
import { apiGet, buildApiUrl } from '@/lib/api';

describe('frontend api helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  it('builds URLs from NEXT_PUBLIC_API_BASE_URL', () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3999/');
    expect(buildApiUrl('/api/health')).toBe('http://localhost:3999/api/health');
    expect(buildApiUrl('api/devices')).toBe('http://localhost:3999/api/devices');
  });

  it('uses no-store for API fetches', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3000');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'ok' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiGet('/api/health')).resolves.toEqual({ status: 'ok' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/health',
      expect.objectContaining({
        method: 'GET',
        cache: 'no-store',
        headers: expect.objectContaining({ 'X-Workspace-Id': 'default' }),
      })
    );
  });

  it('envoie le workspace actif dans les appels API locaux', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3000');
    localStorage.setItem('sallon-connect-current-workspace', 'ws_alpha');
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await apiGet('/api/ai/rag/status');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/api/ai/rag/status',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Workspace-Id': 'ws_alpha' }),
      })
    );
  });
});
