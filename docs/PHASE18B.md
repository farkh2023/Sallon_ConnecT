# Phase 18B — Historique compact des snapshots d'observabilité

## Objectif

Ajouter un historique compact des snapshots d'observabilité au backend et au frontend de Sallon-ConnecT.

Cette phase permet :
- De capturer l'état global du système à un instant donné
- De stocker uniquement un résumé non sensible (buckets, pas de valeurs brutes)
- De consulter les derniers snapshots
- De calculer des tendances simples
- D'intégrer l'action au scheduler local
- D'afficher les tendances dans le frontend Next.js
- De conserver toutes les règles de sécurité Phase 18

---

## Modèle snapshot

Chaque snapshot est un résumé non sensible de l'état du système :

```json
{
  "id": "obs_xxx",
  "createdAt": "ISO-8601",
  "source": "manual | scheduler | startup",
  "status": "ok | warning | error",
  "phase": 18,
  "backend": {
    "ok": true,
    "uptimeBucket": "short | medium | long",
    "memoryBucket": "low | medium | high"
  },
  "frontend": {
    "expectedPort": 3001,
    "configured": true
  },
  "integrations": {
    "adb": "disabled | available | warning | error",
    "dlna": "disabled | available | warning | error",
    "smartThings": "disabled | available | warning | error",
    "streaming": "disabled | available | warning | error"
  },
  "scheduler": {
    "running": true,
    "activeSchedules": 0
  },
  "notifications": {
    "totalBucket": "none | low | medium | high",
    "unreadBucket": "none | low | medium | high",
    "securityEventsBucket": "none | low | medium | high"
  },
  "security": {
    "secretsProtected": true,
    "runtimeHidden": true,
    "apiCacheDisabled": true,
    "sensitiveActionsBlocked": true
  },
  "runtime": {
    "runtimeFilesBucket": "none | low | medium | high",
    "logsBucket": "none | low | medium | high",
    "portableZipPresent": true
  }
}
```

### Règles buckets

| Champ | Bucket | Condition |
|---|---|---|
| uptimeBucket | short | < 5 min |
| uptimeBucket | medium | < 1 heure |
| uptimeBucket | long | >= 1 heure |
| memoryBucket | low | ratio < 40% |
| memoryBucket | medium | ratio < 70% |
| memoryBucket | high | ratio >= 70% |
| totalBucket / unreadBucket | none | 0 |
| totalBucket / unreadBucket | low | 1–9 |
| totalBucket / unreadBucket | medium | 10–49 |
| totalBucket / unreadBucket | high | >= 50 |

---

## Sécurité

- Jamais de token, secret, password, bearer
- Jamais de contenu runtime brut
- Jamais de logs bruts
- Jamais d'IP complète
- Jamais de chemin absolu complet
- Jamais d'ID complet exposé
- Stockage local uniquement : `runtime/observability-snapshots.json`
- Fichier protégé par `.gitignore` (`runtime/*.json`)
- Sanitisation par `snapshotSafety.js` à chaque écriture

---

## Endpoints API

| Méthode | Endpoint | Description |
|---|---|---|
| GET | `/api/observability/snapshots` | Liste des snapshots (filtres: source, status, limit) |
| POST | `/api/observability/snapshots` | Crée un snapshot manuel |
| GET | `/api/observability/snapshots/latest` | Dernier snapshot |
| GET | `/api/observability/snapshots/stats` | Statistiques (total, ok, warning, error, changes) |
| GET | `/api/observability/snapshots/trends` | Tendances (statusTrend, warningFrequency, etc.) |
| DELETE | `/api/observability/snapshots` | Vide l'historique |
| GET | `/api/observability/snapshots/safety` | Flags de sécurité |

---

## Action scheduler

Action : `observability.snapshot`

- Autorisée dans `schedulerSafety.ALLOWED_ACTIONS`
- Utilise `snapshotEngine.createSnapshot('scheduler')`
- Stocke le snapshot dans `runtime/observability-snapshots.json`
- Crée une notification si warning/error (selon `.env`)
- Ne lance aucun test
- Ne lance aucune action sensible

### Tâche par défaut

Une tâche `Snapshot observabilite` est créée au démarrage si elle n'existe pas :
- Action : `observability.snapshot`
- Planification : `daily` à `21:00`
- Activée : `false` par défaut (opt-in explicite requis)

---

## Notifications

Utilise `notificationEngine` (Phase 12) :
- Si `snapshot.status = warning` et `OBSERVABILITY_SNAPSHOTS_NOTIFY_ON_WARNING=true`
- Si `snapshot.status = error` et `OBSERVABILITY_SNAPSHOTS_NOTIFY_ON_ERROR=true`
- Déduplication existante (30 secondes)
- Message sans détails sensibles

---

## Frontend Next.js

### Composants créés

| Fichier | Description |
|---|---|
| `SnapshotHistory.tsx` | Panel principal avec actions, dernier snapshot, liste |
| `SnapshotStats.tsx` | Compteurs OK/Warning/Error, statut fréquent |
| `SnapshotTrends.tsx` | Tendances visuelles par bucket |

### Hook (`useObservability.ts`)

Fonctions ajoutées :
- `loadSnapshots()` — charge la liste
- `createSnapshot()` — POST pour créer un snapshot manuel
- `loadSnapshotStats()` — charge les statistiques
- `loadSnapshotTrends()` — charge les tendances
- `clearSnapshots()` — vide l'historique

---

## Tests

### Backend (`tests/backend/observability-snapshots.test.js`)

- POST crée un snapshot valide
- GET retourne liste
- GET /latest retourne le dernier
- GET /stats retourne compteurs
- GET /trends retourne tendances
- DELETE vide l'historique
- GET /safety localOnly true
- Aucune donnée sensible dans les réponses

### Frontend (`frontend/src/__tests__/components/SnapshotHistory.test.tsx`)

- Rendu empty state
- Rendu snapshot OK
- Rendu warning/error
- Bouton créer snapshot
- Bouton vider historique
- Absence de secret affiché

---

## Variables d'environnement

```env
OBSERVABILITY_SNAPSHOTS_ENABLED=true
OBSERVABILITY_SNAPSHOTS_PATH=runtime/observability-snapshots.json
OBSERVABILITY_SNAPSHOTS_MAX_ITEMS=200
OBSERVABILITY_SNAPSHOTS_NOTIFY_ON_WARNING=true
OBSERVABILITY_SNAPSHOTS_NOTIFY_ON_ERROR=true
OBSERVABILITY_SNAPSHOTS_AUTO_CREATE_ON_START=false
```

---

## Limites actuelles

- Pas de graphe temporel (tendances textuelles uniquement)
- Snapshot startup non implémenté (désactivé par défaut)
- Filtres API limités à source, status, limit
- Pas de pagination (historique limité à MAX_ITEMS)

---

## Prochaines étapes recommandées

- **Phase 19** : Graphe temporel d'observabilité (Chart.js / Recharts)
- Ajouter snapshot au démarrage (`OBSERVABILITY_SNAPSHOTS_AUTO_CREATE_ON_START=true`)
- Export CSV de l'historique (non sensible)
- Alertes différenciées par intégration
