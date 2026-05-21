'use client';

import { useEffect, useState } from 'react';
import { emitSystemEvent } from '@/lib/systemEventBus';
import { buildApiUrl } from '@/lib/api';
import type { SystemEventSeverity, SystemEventSource } from '@/lib/types';

export type SseConnectionState = 'connecting' | 'open' | 'closed' | 'error' | 'disabled';

interface UseServerEventsStreamOptions {
  disabled?: boolean;
}

interface UseServerEventsStreamResult {
  state: SseConnectionState;
}

const SEEN_IDS_MAX = 500;
const SSE_SKIP_TYPES = new Set(['sse.heartbeat', 'sse.connected', 'sse.error']);

function isEventSourceAvailable(): boolean {
  return typeof window !== 'undefined' && typeof EventSource !== 'undefined';
}

function computeInitialState(disabled: boolean): SseConnectionState {
  if (disabled) return 'disabled';
  if (!isEventSourceAvailable()) return 'disabled';
  return 'connecting';
}

export function useServerEventsStream(
  options: UseServerEventsStreamOptions = {}
): UseServerEventsStreamResult {
  const { disabled = false } = options;
  const [state, setState] = useState<SseConnectionState>(() => computeInitialState(disabled));

  useEffect(() => {
    if (disabled || !isEventSourceAvailable()) return;

    const seenIds = new Set<string>();
    const es = new EventSource(buildApiUrl('/api/events/stream'));

    es.onopen = () => setState('open');

    es.onmessage = (event: MessageEvent<string>) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown>;

        const id = typeof data.id === 'string' ? data.id : null;
        const type = typeof data.type === 'string' ? data.type : null;
        const message = typeof data.message === 'string' ? data.message : null;

        if (!id || !type || !message) return;
        if (SSE_SKIP_TYPES.has(type)) return;

        if (seenIds.has(id)) return;
        seenIds.add(id);
        if (seenIds.size > SEEN_IDS_MAX) {
          const [first] = seenIds;
          seenIds.delete(first);
        }

        emitSystemEvent({
          type,
          severity: (data.severity as SystemEventSeverity) ?? 'info',
          source: (data.source as SystemEventSource) ?? 'backend',
          message,
          details: typeof data.details === 'string' ? data.details : undefined,
        });
      } catch {
        // Ignore malformed SSE messages
      }
    };

    es.onerror = () => setState('error');

    return () => { es.close(); };
  }, [disabled]);

  return { state };
}
