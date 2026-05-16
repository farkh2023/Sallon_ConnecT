export function getApiBaseUrl(): string {
  return (
    (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL) ||
    'http://localhost:3000'
  );
}

export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl().replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function handleApiError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Erreur réseau inconnue';
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(buildApiUrl(path), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>;
    throw new Error((err.error as string) || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const apiGet    = <T>(path: string)                    => request<T>('GET',    path);
export const apiPost   = <T>(path: string, body?: unknown)    => request<T>('POST',   path, body);
export const apiPatch  = <T>(path: string, body?: unknown)    => request<T>('PATCH',  path, body);
export const apiDelete = <T>(path: string)                    => request<T>('DELETE', path);
