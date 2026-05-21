# Phase 31 — Centre de notifications intelligent

## Objectif

Transformer les événements système en notifications utiles, priorisées, regroupées et lisibles, sans cloud ni télémétrie externe. Le centre est 100 % local : stockage localStorage uniquement, aucun appel réseau, aucun secret transmis.

## Architecture

```
systemEventBus  ──subscribe──►  notificationCenter.ts  ──notify──►  useNotificationsCenter (hook)
                                        │                                      │
                                  localStorage                      NotificationsCenterPanel (UI)
                                  (max 100)
```

- **`notificationCenter.ts`** : moteur singleton. Souscrit au `systemEventBus`, convertit les `SystemEvent` en `LocalNotification`, gère le grouping, la déduplication, la persistance et les listeners UI.
- **`useNotificationsCenter`** : hook React qui initialise le moteur, souscrit aux notifications, et expose les actions (filter, markAsRead, clearAll, requestBrowserPermission).
- **`NotificationsCenterPanel`** : composant UI intégré dans `ObservabilityPanel` sous "Centre de notifications".

## Modèle LocalNotification

```typescript
interface LocalNotification {
  id: string;                        // nc_{timestamp}_{random}
  timestamp: string;                 // ISO 8601
  title: string;                     // dérivé du type d'événement
  message: string;                   // maskSensitiveClientText appliqué
  severity: 'info' | 'success' | 'warning' | 'error';
  source: 'system' | 'network' | 'backup' | 'scheduler' | 'security' | 'sse' | 'frontend' | 'backend';
  read: boolean;
  groupKey?: string;                 // = evt.type pour le grouping
  count?: number;                    // nombre d'occurrences regroupées
  relatedEventIds?: string[];        // ids des événements fusionnés
}
```

Note : `LocalNotification` est distinct de `NotificationItem` (modèle backend) pour éviter toute collision de types.

## Règles de conversion

| Champ SystemEvent | → LocalNotification        |
|-------------------|---------------------------|
| `severity`        | mappé directement          |
| `source`          | via `SOURCE_MAP`           |
| `type`            | détermine le `title`       |
| `message`         | `maskSensitiveClientText`  |
| `id`              | ajouté à `_seenEventIds`   |

### Mapping source

| Source événement  | Source notification |
|-------------------|---------------------|
| `backend`         | `backend`           |
| `frontend`        | `frontend`          |
| `network`         | `network`           |
| `scheduler`       | `scheduler`         |
| `backup`          | `backup`            |
| `security`        | `security`          |
| `notifications`   | `system`            |
| autre             | `system`            |

### Mapping titre

| Préfixe type      | Titre affiché    |
|-------------------|------------------|
| `backend.*`       | Backend          |
| `sse.*`           | Flux SSE         |
| `help.*`          | Centre d'aide    |
| `security.*`      | Sécurité         |
| `notifications.*` | Notifications    |
| `scheduler.*`     | Scheduler        |
| `backup.*`        | Backup           |
| autre             | Système          |

## Règles anti-spam

- **Types ignorés** : `sse.heartbeat`, `sse.connected`, `sse.error` — silencieusement ignorés.
- **Déduplication par id** : chaque `SystemEvent.id` n'est traité qu'une seule fois (Set `_seenEventIds`).
- **Grouping** : si une notification non lue du même `groupKey` (= `evt.type`) existe depuis moins de 5 minutes, son compteur `count` est incrémenté plutôt que de créer une nouvelle entrée.
- **Limite** : maximum 100 notifications en mémoire et en localStorage.

## Sécurité local-only

- `maskSensitiveClientText()` appliqué sur chaque message avant stockage.
- Aucune action sensible ne peut être déclenchée depuis une notification.
- Aucun appel réseau externe dans tout le pipeline.
- `securityLocalOnly: true` affiché dans le footer du composant.
- localStorage uniquement — aucune synchronisation cloud, aucune télémétrie.

## Persistance

- Clé localStorage : `sallon_connect_notifications`
- Limite : 100 entrées (les plus récentes conservées).
- Sauvegarde automatique après chaque modification (processEvent, markRead, clear).
- Chargement au démarrage du module (avant initialisation React).
- Nettoyage complet via `clearNotifications()`.

## Tests

### notificationCenter.test.ts (42 tests)

| Catégorie | Tests |
|-----------|-------|
| Conversion SystemEvent → LocalNotification | 4 |
| Déduplication | 2 |
| Regroupement (grouping) | 4 |
| Compteur non lus | 3 |
| markAsRead / markAllAsRead / clear | 5 |
| Rétention max 100 | 2 |
| Persistance localStorage | 3 |
| Sécurité (masquage, no fetch) | 2 |
| Subscriptions | 4 |

### NotificationsCenterPanel.test.tsx (13 tests)

| Catégorie | Tests |
|-----------|-------|
| État vide | 3 |
| Badge non lu | 2 |
| Filtres severity | 3 |
| Filtres source | 2 |
| Effacement avec confirmation | 3 |
| Sécurité (no action sensible, no fetch) | 3 |

## Limites connues

- Les notifications ne persistent pas entre onglets (localStorage synchronisé uniquement au rechargement).
- Le grouping est basé sur `evt.type` : deux types différents avec le même message ne seront pas fusionnés.
- Les notifications navigateur (`Notification API`) restent opt-in et désactivées par défaut.
- `resetNotificationCenter()` est exposé pour l'isolation en tests uniquement — ne pas appeler en production.

## Futures extensions

- Filtrage par plage de dates (actuel : aucune limite temporelle côté UI).
- Actions rapides sur une notification (ex : "voir les logs") — actuellement bloquées pour raisons de sécurité.
- Export JSON/CSV des notifications (symétrique à systemEventBus).
- Sons/vibration pour les notifications error (opt-in uniquement).
