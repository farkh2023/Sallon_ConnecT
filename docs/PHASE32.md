# Phase 32 — Tableau de bord diagnostic avancé

## Objectif

Ajouter un diagnostic local lisible depuis l'observabilité, sans cloud, sans télémétrie externe et sans exposition de secret. Le tableau agrège l'état backend, SSE, scheduler, backup, notifications, stockage local et sécurité local-only.

## Architecture

```
server/src/routes/diagnostics.js
  GET /api/diagnostics/overview
        │
        ▼
frontend/src/hooks/useDiagnosticsOverview.ts
        │
        ▼
frontend/src/components/diagnostics/DiagnosticDashboard.tsx
        │
        ▼
frontend/src/components/observability/ObservabilityPanel.tsx
```

## Endpoint backend

`GET /api/diagnostics/overview`

Réponse non mise en cache (`Cache-Control: no-store`) :

```json
{
  "timestamp": "2026-05-22T00:00:00.000Z",
  "status": "ok",
  "uptime": 3600,
  "nodeVersion": "v22.11.0",
  "memory": { "rss": 10000000, "heapUsed": 5000000, "heapTotal": 8000000 },
  "scheduler": {
    "status": "running",
    "running": true,
    "activeSchedules": 2,
    "totalSchedules": 3,
    "tickMs": 30000,
    "nextScheduled": null
  },
  "backup": {
    "enabled": true,
    "count": 2,
    "latest": { "backupId": "backup_...", "createdAt": "2026-05-22T00:00:00.000Z" }
  },
  "notifications": { "total": 5, "unread": 1 },
  "sse": { "clients": 1 },
  "security": {
    "localOnly": true,
    "firebase": false,
    "cloudServices": false,
    "externalPush": false
  }
}
```

L'endpoint ne retourne pas de logs bruts, chemin absolu, IP locale complète, token, mot de passe, clé API ni contenu de fichier runtime.

## Snapshot frontend

`DiagnosticSnapshot` contient toujours l'entrée `backup`.

```typescript
interface DiagnosticSnapshot {
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'offline' | 'unknown';
  score: number;
  backend: DiagnosticEntry;
  frontend: DiagnosticEntry;
  sse: DiagnosticEntry;
  network: DiagnosticEntry;
  storage: DiagnosticEntry;
  scheduler: DiagnosticEntry;
  backup: DiagnosticEntry;
  notifications: DiagnosticEntry;
  security: DiagnosticEntry;
}
```

Chaque `DiagnosticEntry` expose `status`, `label`, `score` et un `detail` optionnel.

## Scoring

Le score total est plafonné à 100 :

| Entrée | Points |
|---|---:|
| Backend joignable | 20 |
| SSE connecté | 15 |
| Scheduler running | 10 |
| Backup activé | 10 |
| Notifications disponibles | 10 |
| Stockage local disponible | 10 |
| Sécurité local-only valide | 15 |
| Fetch diagnostic réussi | 10 |

Statut global :

| Score | Statut |
|---:|---|
| 80 à 100 | `healthy` |
| 50 à 79 | `degraded` |
| 1 à 49 | `degraded` |
| 0 | `offline` |

Si le score descend sous 50, le hook émet un événement système local `diagnostic.degraded`.

## UI

`DiagnosticDashboard` affiche :

- score global et statut ;
- cartes Backend, SSE, Scheduler, Backup, Notifications, Stockage local, Sécurité ;
- bouton `Actualiser` ;
- bouton `Export JSON` ;
- état de chargement initial ;
- état erreur avec action `Réessayer` ;
- mention local-only.

Le composant est intégré dans `ObservabilityPanel` sous la section `Diagnostic avancé`.

## Sécurité local-only

- Aucun appel cloud ajouté.
- Le frontend appelle uniquement `buildApiUrl('/api/diagnostics/overview')`.
- L'export JSON contient la réponse diagnostic brute, volontairement limitée aux champs non sensibles.
- `security.localOnly` doit rester `true`.
- `firebase`, `cloudServices` et `externalPush` doivent rester `false`.

## Tests

- `frontend/src/__tests__/hooks/useDiagnosticsOverview.test.tsx` : loading initial, succès, erreur, présence de `backup` dans le snapshot.
- `frontend/src/__tests__/components/DiagnosticDashboard.test.tsx` : chargement, score, cartes, bouton Actualiser, export JSON, état erreur, sécurité local-only.
- `frontend/src/__tests__/components/ObservabilityPanel.test.tsx` : intégration du diagnostic avec l'observabilité existante.
- `tests/backend/diagnostics.test.js` : endpoint, champs obligatoires, `security.localOnly`, absence de secrets, `backup`, cache `no-store`.

## Limites connues

- Le statut SSE côté frontend est déduit du nombre de clients vu par le backend et de la disponibilité de `EventSource`.
- Le score est un indicateur synthétique, pas une preuve d'intégrité complète.
- Le diagnostic ne lit pas les contenus runtime, logs ou backups.
- L'export JSON reste local navigateur et ne déclenche aucun upload.
