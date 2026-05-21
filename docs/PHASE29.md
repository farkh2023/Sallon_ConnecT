# Phase 29 — Persistance locale des événements système

## Objectif

Conserver l'historique des événements système entre les rechargements de page, sans cloud, sans télémétrie externe, sans aucune fuite d'information sensible. Toutes les données restent dans `localStorage` du navigateur.

## Architecture de persistance

```
frontend/src/
  lib/
    systemEventStorage.ts     Couche de persistance (lecture, écriture, nettoyage)
    systemEventBus.ts         Bus modifié : charge au démarrage, sauvegarde à chaque mutation
  hooks/
    useSystemEvents.ts        Expose storageAvailable, exportJson, exportCsv
  components/observability/
    SystemEventsPanel.tsx     UI : indicateur historique, compteur, boutons export
  __tests__/
    help/systemEventStorage.test.ts   18 tests unitaires de la couche stockage
    help/systemEventBus.test.ts       +7 tests de persistance (20 tests au total)
```

## Format stocké

Clé localStorage : `sallon_connect_system_events`

Valeur : tableau JSON d'objets `SystemEvent` :

```json
[
  {
    "id": "evt_1716321845123_abc12",
    "timestamp": "2026-05-21T21:04:05.123Z",
    "type": "backend.online",
    "severity": "success",
    "source": "backend",
    "message": "Backend en ligne",
    "details": "Phase 29",
    "read": false
  }
]
```

Les champs `message` et `details` sont toujours masqués par `maskSensitiveClientText` avant d'être stockés (opération faite en amont dans `emitSystemEvent`).

## Règles de rétention

| Règle | Valeur |
|---|---|
| Nombre maximum d'événements | 200 |
| Durée maximale de rétention | 7 jours |
| Ordre conservé | LIFO (plus récent en premier) |
| Nettoyage | Automatique au chargement (`loadEvents`) |

Le nettoyage s'applique silencieusement : les événements expirés ou en excès sont simplement ignorés.

## Couche de stockage (`systemEventStorage.ts`)

| Fonction | Rôle |
|---|---|
| `isStorageAvailable()` | Vérifie si `localStorage` est accessible (SSR-safe, gère les exceptions) |
| `loadEvents()` | Charge, valide, filtre par âge, tronque et retourne les événements |
| `saveEvents(events)` | Sérialise et écrit dans `localStorage` (silencieux si QuotaExceeded) |
| `clearStoredEvents()` | Supprime la clé `localStorage` |

La validation `isValidEvent()` vérifie que chaque entrée possède les champs requis aux bons types avant de les accepter. Les entrées corrompues ou partielles sont ignorées sans erreur.

## Intégration dans le bus

`systemEventBus.ts` :
- Initialise `_events = loadEvents()` au chargement du module (SSR retourne `[]`)
- Appelle `saveEvents(_events)` après chaque mutation : `emitSystemEvent`, `markEventRead`, `markAllEventsRead`
- Appelle `clearStoredEvents()` dans `clearAllEvents()`

## Exports locaux

| Fonction (bus) | Contenu produit |
|---|---|
| `getEventsAsJson()` | JSON indenté de tous les événements en mémoire |
| `getEventsAsCsv()` | CSV avec entête `id,timestamp,type,severity,source,message,details,read` |
| `exportEventsJson()` | Déclenche le téléchargement `system-events-YYYY-MM-DD.json` |
| `exportEventsCsv()` | Déclenche le téléchargement `system-events-YYYY-MM-DD.csv` |

Les exports sont 100% côté navigateur (`URL.createObjectURL`, `document.createElement('a')`). Aucun appel serveur.

## UI `SystemEventsPanel` (ajouts Phase 29)

- Indicateur **● Historique local activé · N événements persistés** (vert) quand `localStorage` est disponible
- Message **⚠ Historique local indisponible** (ambre) sinon
- Bouton **Export JSON** (désactivé si aucun événement)
- Bouton **Export CSV** (désactivé si aucun événement)
- Boutons Export / Marquer comme lu / Effacer regroupés dans la même rangée d'actions
- Pied de page mis à jour : "Journal local — aucune télémétrie externe — max 200 événements · 7 jours de rétention"

## Règles sécurité / local-only

- Aucun secret n'est jamais stocké : `maskSensitiveClientText` s'applique **avant** `saveEvents`
- Aucun appel réseau dans `saveEvents`, `loadEvents`, `clearStoredEvents` (vérifié par test)
- `isStorageAvailable` retourne `false` en SSR (`typeof window === 'undefined'`) → aucune opération côté serveur
- Les erreurs `localStorage` (QuotaExceeded, SecurityError) sont absorbées silencieusement

## Tests ajoutés (25 nouveaux)

### `systemEventStorage.test.ts` (18 tests)

| Suite | Tests |
|---|---|
| isStorageAvailable | true en jsdom, false si setItem lève |
| loadEvents | vide, charge, ignore invalides, filtre âge >7j, limite 200, JSON invalide, scalaire, getItem lève |
| saveEvents | sauvegarde, tronque 200, ne lève pas si QuotaExceeded, ne sauvegarde pas si indisponible |
| clearStoredEvents | supprime clé, ne lève pas si absente |
| Sécurité | aucun fetch, données masquées préservées |

### `systemEventBus.test.ts` (7 tests ajoutés, 20 au total)

| Suite | Tests ajoutés |
|---|---|
| Persistance | emitSystemEvent sauvegarde, markEventRead met à jour, clearAllEvents supprime |
| Export | getEventsAsJson valide, getEventsAsCsv entête+données, JSON vide, CSV entête seule |

## Résultats lint / test / build

| Étape | Résultat |
|---|---|
| `pnpm lint` | 0 erreur, 0 avertissement |
| `npx vitest run src/__tests__/` | 155/155 tests passés (20 fichiers) |
| `pnpm build` | ✓ Compilé — TypeScript propre — 5 routes statiques |

## Limites connues

- Les événements sont perdus si l'utilisateur vide manuellement les données du navigateur
- `localStorage` est limité à ~5 Mo selon le navigateur — 200 événements restent bien en dessous
- La clé est globale au domaine : deux onglets du même domaine partagent le même journal (comportement standard `localStorage`)
- L'initialisation du bus (`loadEvents` au module-load) ne peut pas être re-testée en isolation sans reset de module dans Vitest — les tests unitaires vérifient la couche stockage directement

## Piste future : IndexedDB

Pour une migration vers IndexedDB :
1. Remplacer `systemEventStorage.ts` par une implémentation async utilisant `idb` ou l'API native
2. Adapter `emitSystemEvent` pour appeler `await saveEvents(...)` (nécessite un bus asynchrone)
3. Mettre à jour `loadEvents` pour être appelé dans un `useEffect` côté hook, pas au module-load
4. L'abstraction actuelle (`loadEvents / saveEvents / clearStoredEvents`) est conçue pour cette migration : seul le corps des fonctions change, pas les signatures côté bus
