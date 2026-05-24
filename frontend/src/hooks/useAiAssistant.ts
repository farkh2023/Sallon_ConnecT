'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import type {
  AiStatusResponse, AiChatResponse,
  AiCommandResponse, AiChatMessage,
} from '@/lib/types';

export function useAiAssistant() {
  const [status,   setStatus]   = useState<AiStatusResponse | null>(null);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const data = await apiGet<AiStatusResponse>('/api/ai/status');
      if (mounted.current) setStatus(data);
    } catch {
      if (mounted.current) setError('Impossible de joindre le backend IA.');
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- loadStatus est async, setState appelé après await
  useEffect(() => { void loadStatus(); }, [loadStatus]);

  const sendMessage = useCallback(async (message: string): Promise<AiChatResponse | null> => {
    if (!mounted.current) return null;
    setLoading(true);
    setError(null);
    const userMsg: AiChatMessage = { role: 'user', content: message, ts: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    try {
      const result = await apiPost<AiChatResponse>('/api/ai/chat', { message });
      if (mounted.current) {
        const assistantMsg: AiChatMessage = {
          role:    'assistant',
          content: result.response ?? result.error ?? 'Pas de reponse.',
          ts:      new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
      return result;
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : 'Erreur reseau');
      }
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const analyzeDiagnostics = useCallback(async (snapshot?: unknown): Promise<AiChatResponse | null> => {
    if (!mounted.current) return null;
    setLoading(true);
    setError(null);
    try {
      const result = await apiPost<AiChatResponse>('/api/ai/diagnose', { snapshot: snapshot ?? {} });
      return result;
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Erreur reseau');
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const suggestCommand = useCallback(async (task: string): Promise<AiCommandResponse | null> => {
    if (!mounted.current) return null;
    setLoading(true);
    setError(null);
    try {
      const result = await apiPost<AiCommandResponse>('/api/ai/suggest-command', { task });
      return result;
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Erreur reseau');
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => setMessages([]), []);

  return {
    status, messages, loading, error,
    loadStatus, sendMessage, analyzeDiagnostics, suggestCommand, clearMessages,
  };
}
