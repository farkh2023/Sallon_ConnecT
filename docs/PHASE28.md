# Phase 28 — Observabilité temps réel : journal des événements système

## Objectif

Ajouter un journal d'événements système local, en temps réel, intégré dans le panneau Observabilité. Aucun WebSocket, aucune télémétrie externe. Tous les événements restent en mémoire côté client (max 200), effacés à la fermeture de l'onglet.

## Architecture

```
frontend/src/
  lib/
    systemEventBus.ts         Singleton : stockage, émission, abonnement
  hooks/
    useSystemEvents.ts        Hook React : sync avec le bus, filtrage local
  components/observability/
    SystemEventsPanel.tsx     UI : timeline, filtres, mark-as-read, effacer
  __tests__/
    help/systemEventBus.test.ts           13 tests unitaires (bus seul)
    components/SystemEventsPanel.test.tsx 15 tests de composant
```

## Modèle SystemEvent

```typescript
export type SystemEventSeverity = 'info' | 'success' | 'warning' | 'error';
export type SystemEventSource =
  'backend' | 'frontend' | 'network' | 'scheduler' |
  'backup' | 'security' | 'notifications';

export interface SystemEvent {
  id: string;          // préfixé "evt_"
  timestamp: string;   // ISO 8601
  type: string;        // ex. "backend.online"
  severity: SystemEventSeverity;
  source: SystemEventSource;
  message: string;     // masqué via maskSensitiveClientText
  details?: string;    // optionnel, masqué
  read: boolean;
}
```

## Bus d'événements (`systemEventBus.ts`)

Pattern singleton (module-level state) — pas de React Context pour éviter de modifier `AppShell` et `layout.tsx`.

| Fonction | Rôle |
|---|---|
| `emitSystemEvent(event)` | Crée et stocke l'événement, notifie les listeners |
| `getEvents()` | Retourne la liste LIFO (plus récent en premier) |
| `getUnreadCount()` | Nombre d'événements avec `read === false` |
| `markEventRead(id)` | Marque un événement comme lu |
| `markAllEventsRead()` | Marque tous comme lus |
| `clearAllEvents()` | Vide complètement le journal |
| `subscribeToEventBus(fn)` | Abonnement — retourne la fonction de désabonnement |

Contrainte : max 200 événements (les plus anciens sont éliminés silencieusement).

## Sources d'événements câblées

| Source | Hook / composant | Événements émis |
|---|---|---|
| `useBackendHealth` | Transition d'état `backendStatus` | `backend.online`, `backend.offline`, `backend.degraded`, `backend.unknown` |
| `useHelpCenter` | Après chaque `refreshStatus()` | `help.refresh.online/offline/degraded`, `notifications.unread`, `security.localonly.confirmed`, `help.refresh.error` |

## UI `SystemEventsPanel`

- Filtre par **severity** : Tous / Info / Succès / Avertissement / Erreur
- Filtre par **source** : Toutes / Backend / Frontend / Réseau / Scheduler / Backup / Sécurité / Notifications
- Badge **N non lus** en temps réel
- Bouton **Marquer comme lu** (désactivé si aucun non lu)
- Bouton **Effacer** avec confirmation en 2 clics (Effacer → Confirmer effacement + Annuler)
- Timeline scrollable (max-h 480px), couleur par severity
- État vide : "Aucun événement enregistré" / "Aucun événement pour ce filtre"
- Footer : "Journal local — aucune télémétrie externe — max 200 événements"

## Règles sécurité / local-only

- `maskSensitiveClientText()` appliqué à `message` et `details` avant stockage
- Aucune écriture dans `localStorage` ou `sessionStorage`
- Aucun appel réseau externe dans `emitSystemEvent` (vérifié par test : `fetch` mocké ne doit pas être appelé)
- Aucune donnée sensible affichée : pas de `Bearer `, pas de `password=`

## Intégration

`SystemEventsPanel` ajouté à `ObservabilityPanel.tsx` comme dernière section :

```tsx
<PanelSection title="Événements système temps réel">
  <SystemEventsPanel />
</PanelSection>
```

## Tests ajoutés (28 nouveaux)

### `systemEventBus.test.ts` (13 tests)

| Suite | Tests |
|---|---|
| Création | id préfixé evt_, LIFO, limite 200 |
| Compteur | count, markEventRead, markAllEventsRead |
| Vider | clearAllEvents |
| Listeners | subscribe/unsubscribe, notif sur markAll/clear |
| Sécurité | masquage message, masquage details, pas de fetch |

### `SystemEventsPanel.test.tsx` (15 tests)

| Suite | Tests |
|---|---|
| État vide | message vide, bouton Marquer désactivé |
| Création | affiche événement, badge non lus, détails |
| Filtrage | filtre severity, filtre source, retour Tous |
| Marquer comme lu | individuel, tous |
| Vider journal | confirmation, effacement, annulation |
| Sécurité | pas de données sensibles, sync externe markAll |

## Résultats lint / test / build

| Étape | Résultat |
|---|---|
| `pnpm lint` | 0 erreur, 0 avertissement |
| `npx vitest run src/__tests__/` | 130/130 tests passés (19 fichiers) |
| `pnpm build` | ✓ Compilé — 5 routes statiques générées |

## Limites connues

- Les événements sont perdus à la fermeture ou rechargement de l'onglet (pas de persistance)
- Les `act()` warnings dans les tests SystemEventsPanel sont bénins — proviennent de l'abonnement asynchrone au bus singleton, pas de vrais re-renders non attendus
- Polling uniquement (30s dans `useBackendHealth`) — les événements ne sont pas en temps réel ms-précis

## Prochaines extensions possibles

- Phase 29 : Export du journal (JSON / CSV) depuis le panneau
- Phase 29 : Persistance optionnelle dans `localStorage` (avec opt-in explicite)
- Phase 30 : Remplacement du polling par SSE (Server-Sent Events) pour les événements backend
