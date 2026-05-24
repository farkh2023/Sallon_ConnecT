import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRag } from '@/hooks/useRag';
import { useKnowledge } from '@/hooks/useKnowledge';
import { useAgents } from '@/hooks/useAgents';
import { useWorkflows } from '@/hooks/useWorkflows';
import { setStoredWorkspaceId } from '@/lib/workspaceStorage';

function jsonOk(body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3000');
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    if (url.includes('/api/ai/rag/status')) return jsonOk({ indexed: false, chunkCount: 0, sources: [], mode: null, indexedAt: null });
    if (url.includes('/api/ai/knowledge/status')) return jsonOk({ enabled: true });
    if (url.includes('/api/ai/knowledge')) return jsonOk({ items: [], meta: { totalItems: 0 }, safety: {} });
    if (url.includes('/api/ai/agents')) return jsonOk({ agents: [], runs: [] });
    if (url.includes('/api/ai/workflows/templates')) return jsonOk({ templates: [] });
    if (url.includes('/api/ai/workflows')) return jsonOk({ workflows: [], runs: [] });
    return jsonOk({ ok: true });
  }));
});

describe('workspace-aware hooks', () => {
  it('rafraichit RAG, KB, agents et workflows apres switch workspace', async () => {
    const fetchMock = fetch as unknown as ReturnType<typeof vi.fn>;

    renderHook(() => useRag());
    renderHook(() => useKnowledge());
    renderHook(() => useAgents());
    renderHook(() => useWorkflows());

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fetchMock.mockClear();

    act(() => setStoredWorkspaceId('ws_beta'));

    await waitFor(() => {
      const calls = fetchMock.mock.calls.map(([url, init]) => ({
        url: String(url),
        workspaceId: ((init as { headers?: Record<string, string> }).headers || {})['X-Workspace-Id'],
      }));
      expect(calls.some(c => c.url.includes('/api/ai/rag/status') && c.workspaceId === 'ws_beta')).toBe(true);
      expect(calls.some(c => c.url.includes('/api/ai/knowledge') && c.workspaceId === 'ws_beta')).toBe(true);
      expect(calls.some(c => c.url.includes('/api/ai/agents') && c.workspaceId === 'ws_beta')).toBe(true);
      expect(calls.some(c => c.url.includes('/api/ai/workflows') && c.workspaceId === 'ws_beta')).toBe(true);
    });
  });
});
