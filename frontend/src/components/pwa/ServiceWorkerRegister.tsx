'use client';

import { useEffect, useState } from 'react';

export function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState<ServiceWorkerRegistration | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const shouldRegister =
      process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_SW === 'true';

    if (!shouldRegister) return;

    let mounted = true;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        if (!mounted) return;

        if (registration.waiting) setUpdateReady(registration);

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          if (!worker) return;

          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller && mounted) {
              setUpdateReady(registration);
            }
          });
        });
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Service worker indisponible');
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (updateReady) {
    return (
      <div className="pwa-toast" role="status" aria-live="polite">
        <span>Mise a jour locale disponible</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-brand px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral"
        >
          Actualiser
        </button>
      </div>
    );
  }

  if (error && process.env.NEXT_PUBLIC_ENABLE_SW === 'true') {
    return (
      <div className="pwa-toast border-danger/25 text-red-300" role="status" aria-live="polite">
        Service worker non charge
      </div>
    );
  }

  return null;
}
