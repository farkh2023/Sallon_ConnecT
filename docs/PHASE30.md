# Phase 30 — SSE local sécurisé + flux temps réel backend

## Objectif

Remplacer le polling pur par un flux Server-Sent Events (SSE) local pour transmettre les événements système du backend vers le frontend en temps réel, sans WebSocket, sans cloud, sans télémétrie externe.

## Pourquoi SSE plutôt que WebSocket

| Critère | SSE | WebSocket |
|---|---|---|
| Direction | Unidirectionnel (server → client) | Bidirectionnel |
| Protocole | HTTP standard | Upgrade HTTP → WS |
| Reconnexion automatique | Native (`EventSource`) | À implémenter |
| Compatibilité navigateur | Excellente | Excellente |
| Proxys / nginx | Compatible (flush suffisant) | Nécessite configuration |
| Complexité | Faible | Plus élevée |
| Besoin du projet | Lecture seule | Non nécessaire |

Pour Sallon-ConnecT, le flux est unidirectionnel (backend → frontend). SSE est le choix naturel.

## Architecture backend

```
server/
  server.js                       Montage /api/events + émission backend.started
  src/
    routes/
      events.js                   GET /api/events/stream (SSE) + GET /api/events/client-count
    services/
      serverEventBus.js           Singleton : subscribe, unsubscribe, publish, getClientCount
```

### `serverEventBus.js`

Singleton Node.js (module-level state) :

| Fonction | Rôle |
|---|---|
| `subscribe(res)` | Enregistre un client, retourne un `id` numérique (null si MAX_CLIENTS=50 atteint) |
| `unsubscribe(id)` | Supprime le client |
| `publish(event)` | Diffuse aux abonnés, supprime silencieusement les clients dont `write()` lève |
| `getClientCount()` | Nombre de clients actifs |
| `_sanitizeEvent(event)` | Masque données sensibles, valide severity/source |

### Endpoint `GET /api/events/stream`

Headers envoyés :
```
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no
```

Séquence à la connexion :
1. Validation de l'origine (403 si non-locale)
2. Envoi immédiat d'un événement `sse.connected`
3. Heartbeat toutes les 30s (`sse.heartbeat`)
4. Nettoyage sur `req.on('close')`

### Endpoint `GET /api/events/client-count`

```json
{ "clients": 2 }
```

## Architecture frontend

```
frontend/src/
  hooks/
    useServerEventsStream.ts      Hook SSE client
  components/observability/
    SystemEventsPanel.tsx         Badge statut SSE (+ modifications Phase 28/29)
  __tests__/
    hooks/useServerEventsStream.test.tsx   12 tests de comportement
```

### `useServerEventsStream(options?)`

```typescript
type SseConnectionState = 'connecting' | 'open' | 'closed' | 'error' | 'disabled';

function useServerEventsStream(options?: { disabled?: boolean }): { state: SseConnectionState }
```

Comportement :
- `disabled=true` OU `EventSource` absent (SSR, jsdom sans mock) → état `'disabled'`, aucune connexion
- Connexion à `buildApiUrl('/api/events/stream')` (localhost:3000 par défaut)
- `es.onopen` → état `'open'`
- `es.onmessage` → parse JSON, déduplique par `id`, injecte dans `systemEventBus`
- `es.onerror` → état `'error'` (EventSource reconnecte nativement)
- Cleanup : `es.close()`

### Déduplication et filtrage SSE

- IDs vus stockés dans un `Set<string>` local (max 500 entrées, FIFO)
- Types `sse.heartbeat`, `sse.connected`, `sse.error` ignorés (pas injectés dans le bus)
- Messages malformés ignorés silencieusement

### UI dans `SystemEventsPanel`

```
● Flux temps réel local actif      (open, vert)
◌ Connexion…                       (connecting, bleu)
⚠ Erreur flux SSE — fallback polling (error, ambre)
○ Flux temps réel désactivé        (disabled, slate)
○ Flux temps réel déconnecté       (closed, slate)
```

## Format des événements SSE

```
data: {"id":"srv_1716325200123_abc12","type":"backend.started","severity":"success","source":"backend","message":"Backend démarré sur le port 3000","timestamp":"2026-05-21T22:00:00.123Z"}\n\n
```

Tous les champs correspondent au type `SystemEvent` côté frontend, sauf que l'injection via `emitSystemEvent` applique `maskSensitiveClientText` une seconde fois (défense en profondeur).

## Sécurité local-only

- Origine validée : seules `http://localhost:3000` et `http://localhost:3001` sont acceptées — 403 sinon
- `_sanitizeEvent` masque Bearer tokens, mots de passe, chemins absolus Windows avant diffusion
- Aucun appel réseau externe dans `serverEventBus.publish()` (vérifié par test)
- `EventSource` se connecte uniquement à `buildApiUrl(...)` → localhost
- Aucun secret transmis : severity, source, message (masqué), details (masqué) seulement

## Fallback polling

Le polling existant (`useBackendHealth` toutes les 30s, `useHelpCenter` au démarrage) est conservé intégralement. SSE complète le polling — il ne le remplace pas. En cas d'erreur SSE (`state === 'error'`), les données restent fraîches via polling.

## Événements émis côté backend

| Moment | Type | Source |
|---|---|---|
| Démarrage serveur | `backend.started` | `backend` |
| Connexion SSE | `sse.connected` | `backend` |
| Heartbeat 30s | `sse.heartbeat` | `backend` |

## Tests ajoutés (26 nouveaux)

### `tests/backend/events.test.js` (14 tests)

| Suite | Tests |
|---|---|
| serverEventBus unitaire | subscribe/id, unsubscribe compte, publish diffuse, publish vide, write lève → client supprimé |
| Masquage | Bearer masqué, chemin Windows masqué, données sensibles dans payload publié |
| GET /api/events/stream | Headers SSE corrects, événement sse.connected envoyé, pas de secrets dans stream |
| Sécurité origine | 403 si origine non-locale, 200 sans en-tête Origin |
| GET /api/events/client-count | Retourne nombre numérique |

### `frontend/src/__tests__/hooks/useServerEventsStream.test.tsx` (12 tests)

| Suite | Tests |
|---|---|
| État initial | connecting si ES disponible, disabled si disabled=true, no ES créé si disabled |
| Transitions | open event, error event, unmount → close() |
| Injection bus | message → bus, dupliqué ignoré, heartbeat ignoré, malformé ignoré, sans id ignoré |
| Sécurité | aucun fetch lors connexion SSE |

## Résultats lint / test / build

| Étape | Résultat |
|---|---|
| `pnpm lint` | 0 erreur ✅ |
| Frontend `npx vitest run` | 168/168 tests passés (21 fichiers) ✅ |
| Backend `npx jest --runInBand` | 108/108 tests passés (16 fichiers) ✅ |
| `pnpm build` | ✓ TypeScript propre — 5 routes statiques ✅ |

## Limites connues

- `EventSource` n'est pas disponible en SSR (Next.js) : le hook détecte `typeof EventSource === 'undefined'` et reste en `'disabled'` sans erreur
- La reconnexion native de `EventSource` utilise un backoff exponentiel selon le navigateur — non configurable
- 50 clients SSE maximum (const `MAX_CLIENTS`) — adapté à un usage local mono-utilisateur
- Le heartbeat (30s) maintient la connexion mais ne déclenche pas de mise à jour frontend
- En cas de redémarrage backend, le client SSE reconnecte automatiquement (comportement natif EventSource)

## Future évolution WebSocket

Si une communication bidirectionnelle devient nécessaire (ex. commandes frontend → backend en temps réel) :

1. Remplacer `EventSource` par `WebSocket` dans le hook
2. Ajouter `ws` (ou `socket.io`) côté backend
3. L'abstraction actuelle (`useServerEventsStream` → `emitSystemEvent`) est conçue pour cette migration : seul le hook change, pas le bus
4. Conserver le filtrage origin et le masquage des données sensibles
