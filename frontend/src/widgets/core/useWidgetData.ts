'use client';

import { useEffect, useCallback, useRef, useReducer } from 'react';
import { apiGet } from '@/lib/api';

type State<T> = { data: T | null; loading: boolean; error: string | null };
type Action<T> =
  | { type: 'start' }
  | { type: 'success'; data: T }
  | { type: 'failure'; error: string };

function reducer<T>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'start':   return { data: state.data, loading: true,  error: null };
    case 'success': return { data: action.data, loading: false, error: null };
    case 'failure': return { data: state.data,  loading: false, error: action.error };
  }
}

const init = <T,>(): State<T> => ({ data: null, loading: true, error: null });

export function useWidgetData<T>(path: string) {
  const [state, dispatch] = useReducer(reducer<T>, undefined, init<T>);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const load = useCallback(async () => {
    if (!mounted.current) return;
    dispatch({ type: 'start' });
    try {
      const result = await apiGet<T>(path);
      if (mounted.current) dispatch({ type: 'success', data: result });
    } catch (err) {
      if (mounted.current) dispatch({ type: 'failure', error: err instanceof Error ? err.message : 'Erreur reseau' });
    }
  }, [path]);

  useEffect(() => { void load(); }, [load]);

  return { data: state.data, loading: state.loading, error: state.error, refresh: load };
}
