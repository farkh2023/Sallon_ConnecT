# Phase 19 — Graphes temporels d'observabilité

## Objectif

Ajouter une visualisation graphique de l'historique des snapshots d'observabilité dans le dashboard frontend Next.js, à l'aide de Recharts. Permettre l'export non sensible des snapshots en JSON et CSV.

---

## Endpoints ajoutés

### `GET /api/observability/snapshots/timeline`

Retourne la liste des snapshots sous forme de scores normalisés (0–1) pour le rendu graphique.

**Query params optionnels :**
- `limit` (défaut: 50, max: 200)
- `status` : `ok` | `warning` | `error`
- `source` : `manual` | `scheduler` | `startup`
- `from` : date ISO (filtre >= from)
- `to` : date ISO (filtre <= to)

**Réponse :**
```json
{
  "items": [
    {
      "id": "obs_abcd12345678",
      "createdAt": "2026-05-17T21:00:00.000Z",
      "source": "manual",
      "status": "ok",
      "statusScore": 1,
      "memoryScore": 1,
      "notificationScore": 0.75,
      "securityScore": 1,
      "integrationScore": 0.75,
      "schedulerScore": 1,
      "runtimeScore": 1
    }
  ],
  "summary": {
    "total": 10,
    "ok": 8,
    "warning": 2,
    "error": 0
  }
}
```

### `GET /api/observability/snapshots/export.json`

Retourne les snapshots sanitizés au format JSON, en pièce jointe téléchargeable.

**Headers :** `Content-Disposition: attachment; filename="observability-snapshots.json"`

### `GET /api/observability/snapshots/export.csv`

Retourne les snapshots au format CSV compact, en pièce jointe téléchargeable.

**En-tête CSV :**
```
createdAt,status,source,memoryBucket,notificationsBucket,schedulerRunning,portableZipPresent
```

**Headers :** `Content-Disposition: attachment; filename="observability-snapshots.csv"`

---

## Scores utilisés

| Score              | Calcul |
|--------------------|--------|
| `statusScore`      | ok=1, warning=0.5, error=0 |
| `memoryScore`      | low=1, medium=0.5, high=0 |
| `notificationScore`| moyenne de unreadBucket + totalBucket (none=1, low=0.75, medium=0.5, high=0.25) |
| `securityScore`    | 4 flags true → 1, ≥3 → 0.5, sinon 0 |
| `integrationScore` | moyenne des 4 intégrations (available=1, disabled=0.75, warning=0.5, error=0) |
| `schedulerScore`   | running=1, sinon 0.5 |
| `runtimeScore`     | moyenne de runtimeFilesBucket + logsBucket (none=1, low=0.75, medium=0.5, high=0.25) |

---

## Composants graphiques

Répertoire : `frontend/src/components/observability/charts/`

| Composant | Description |
|-----------|-------------|
| `ObservabilityCharts.tsx` | Conteneur principal, gère les filtres, la disposition, l'état vide |
| `StatusTimelineChart.tsx` | AreaChart Recharts — statusScore dans le temps |
| `ScoreRadarChart.tsx` | RadarChart Recharts — 6 scores du dernier snapshot |
| `NotificationsTrendChart.tsx` | LineChart — notificationScore dans le temps |
| `IntegrationsTrendChart.tsx` | LineChart — integrationScore dans le temps |
| `SnapshotTimelineTable.tsx` | Tableau HTML compact — date, source, statut, mémoire, notifs, scheduler, sécurité |
| `SnapshotFilters.tsx` | Sélecteurs limit/statut/source + boutons actualiser/export |

---

## Hook — `useObservability`

Nouvelles propriétés exposées :

```typescript
timeline: SnapshotTimelineResponse | null
timelineLoading: boolean
timelineError: string | null
loadSnapshotTimeline: (filters?: SnapshotChartFilters) => Promise<void>
exportSnapshotsJson: () => void
exportSnapshotsCsv: () => void
```

---

## Types ajoutés

Fichier : `frontend/src/lib/types.ts`

- `SnapshotTimelineItem` — un point de la timeline avec les 7 scores
- `SnapshotTimelineSummary` — total/ok/warning/error
- `SnapshotTimelineResponse` — items + summary
- `SnapshotChartFilters` — limit/status/source/from/to

---

## Exports non sensibles

Les deux endpoints d'export n'exposent aucun :
- token / Bearer
- chemin absolu complet
- IP complète
- ID complet
- contenu runtime brut
- contenu de logs bruts

---

## Sécurité

- Les exports appellent uniquement des endpoints sanitizés via `sanitizeForResponse()`
- Aucune réponse sensible stockée dans localStorage
- Les erreurs frontend passent par `handleApiError()` (masquage côté client)
- IDs tronqués à 12 caractères dans la timeline
- `window.open(..., 'noopener,noreferrer')` pour les exports

---

## Tests

### Backend — `tests/backend/observability-timeline.test.js`

- `GET /snapshots/timeline` : items, summary, scores attendus
- Filtre `limit`, `status`, `source`
- Cohérence summary vs items
- Absence de données sensibles
- `GET /snapshots/export.json` : Content-Disposition, tableau JSON, no leak
- `GET /snapshots/export.csv` : Content-Type text/csv, header row attendu, no leak

### Frontend — `frontend/src/__tests__/components/ObservabilityCharts.test.tsx`

- État vide (timeline null ou items vides)
- Rendu avec snapshots (sections graphes visibles)
- Filtres présents
- Boutons export visibles et fonctionnels
- État loading dans le bouton
- Affichage erreur
- Absence de données sensibles dans le DOM

Recharts mocké via `vi.mock('recharts', ...)` pour éviter les erreurs jsdom.

---

## Limites actuelles

- Pas de zoom/pan sur les graphes
- Pas de filtre par date (from/to) dans l'UI (disponible côté API)
- Pas de persistance des filtres entre sessions
- Les exports ouvrent un nouvel onglet (comportement natif navigateur)

---

## Prochaines étapes suggérées

- Phase 20 : alertes et seuils configurables sur les scores d'observabilité
- Ajout de filtres date from/to dans l'UI
- Comparaison de deux plages temporelles (avant/après)
- Export PDF du dashboard observabilité
