# Phase 26 — Stabilisation statut temps réel + UX réseau

**Date :** 2026-05-21
**Statut :** Livré — lint ✅ · 102 tests ✅ · build ✅

---

## Problème résolu

Au premier rendu, certains indicateurs de statut affichaient rouge (✗) avant que la première requête API ne se termine. L'icône de statut `OfflineStatus` pouvait montrer "En ligne" de façon prématurée pour l'état `'unknown'`.

**Cause :** les valeurs initiales étaient `false` (booléen négatif) au lieu de `null` (non encore connu), et l'état `'checking'` n'existait pas dans la machine d'état réseau.

---

## États réseau

### `BackendHealthStatus` (`types.ts`)

| État | Signification | Affichage |
|---|---|---|
| `'checking'` | Premier chargement en cours | "Vérification…" gris |
| `'online'`   | Backend répond `status: ok` | "En ligne" vert |
| `'degraded'` | Backend répond mais status ≠ ok | "Backend dégradé" jaune |
| `'offline'`  | Fetch échoué ou réseau indisponible | "Backend local indisponible" jaune/rouge |
| `'unknown'`  | Donnée insuffisante | "Vérification…" gris |

### `HelpNetworkState` (`types.ts`)

| État | Calcul | Badge Centre d'aide |
|---|---|---|
| `'checking'` | État initial avant réponse | "Vérification en cours…" |
| `'online'`   | `backendOk && !degraded`  | "En ligne" vert |
| `'degraded'` | `backendOk && (obs=false ‖ scheduler=false)` | "Dégradé" ambre |
| `'offline'`  | `!backendOk` ou exception | "Backend hors ligne" rouge |
| `'unknown'`  | Réservé (non déclenché actuellement) | "État inconnu" gris |

---

## Transitions sécurisées

```
(initial) → checking → online
(initial) → checking → offline      (fetch échoué)
online     → checking → online      (rafraîchissement)
online     → checking → degraded    (scheduler ou obs KO)
online     → checking → offline     (backend indisponible)
```

Aucun saut direct `(initial) → offline` : `checking` est toujours intercalé.

---

## Fichiers modifiés

| Fichier | Changement |
|---|---|
| `src/lib/types.ts` | `BackendHealthStatus` + `'checking'` ; `HelpNetworkState` ; `HelpSystemStatus` booleans → `boolean \| null` |
| `src/hooks/useBackendHealth.ts` | `toBackendStatus` renvoie `'checking'` quand `lastCheckedAt === null` ; `loading` initialise à `true` |
| `src/hooks/useHelpCenter.ts` | `DEFAULT_STATUS` avec `null` et `networkState: 'checking'` ; calcul `networkState` après refresh |
| `src/components/pwa/OfflineStatus.tsx` | Gère `'checking'` et `'unknown'` : affiche "Vérification…" (aucun rouge prématuré) |
| `src/components/help/HelpSystemStatus.tsx` | Badge `networkState` ; `StatusRow` gère `null` (…) ; Phase affiche `null` quand inconnu |
| `src/components/dashboard/HeroPanel.tsx` | Badge "Vérification…" au premier rendu ; badge "Backend indisponible" en cas d'erreur ; MetricCard couleur dynamique |
| `src/__tests__/components/HelpSystemStatus.test.tsx` | Nouveau : 10 tests états checking/online/offline/degraded |
| `src/__tests__/components/OfflineStatus.test.tsx` | +3 tests : checking sans rouge, online, absence de faux rouge |
| `src/__tests__/components/HelpCenterPanel.test.tsx` | Mock `networkState: 'online'` + 6 tests catégories (Phase 27) |
| `src/__tests__/components/ProfilesPanel.test.tsx` | Correction pré-existante : champs backup manquants dans `ProfilePermissions` |

---

## Endpoints concernés

| Endpoint | Rôle dans le statut |
|---|---|
| `GET /api/health` | `backendOk`, `phase`, `networkState` |
| `GET /api/notifications/stats` | `unreadNotifications` |
| `GET /api/scheduler/status` | `schedulerActive` |
| `GET /api/observability/overview` | `observabilityOk`, `securityLocalOnly` |
| `GET /api/backup/status` | `backupAvailable` |

---

## Règles UX

1. **Jamais de rouge avant la première réponse API** — les valeurs nulles affichent `…` gris.
2. **Badge réseau visible en permanence** dans le panneau Statut.
3. **Bouton Actualiser désactivé** pendant `loading: true`.
4. **Message explicite** si backend indisponible ("`Backend inaccessible — <détail>`").
5. **Mode local-only préservé** — `securityLocalOnly` reste affiché dans tous les états.

---

## Tests ajoutés

- `HelpSystemStatus.test.tsx` — 10 tests : checking, online, offline, dégradé, bouton Actualiser, mode local
- `OfflineStatus.test.tsx` — +3 tests : checking au premier rendu, online confirmé, absence de rouge prématuré

**Total :** 102 tests (17 fichiers) — tous verts.

---

## Limites connues

- `networkState: 'unknown'` n'est pas déclenché par la logique actuelle (réservé pour cas futurs).
- La TV Dashboard (`TvDashboard.tsx`) utilise `useBackendHealth` mais n'expose pas encore le badge "Vérification…" — hors périmètre Phase 26.
- Le polling (30 s) peut afficher `'checking'` à nouveau lors du rafraîchissement si la connexion est très lente.
