# Phase 8 — SmartThings Samsung TV (lecture seule)

## Objectif

Ajouter une intégration SmartThings prudente et en lecture seule pour préparer le contrôle futur de la Smart TV Samsung et des scènes.

**Aucune scène exécutée. Aucune commande TV. Aucune opération d'écriture.**

---

## Fonctionnement SmartThings

SmartThings est la plateforme de maison connectée Samsung. Elle expose une API REST permettant de :
- lister les locations (domiciles)
- lister les appareils connectés
- lire leur statut
- lister les scènes

Dans cette phase, seules les opérations **GET** sont autorisées.

---

## Token et sécurité

### Où le token est stocké
- **Uniquement** dans `.env` (non versionné)
- **Jamais** dans le code
- **Jamais** dans Git
- **Jamais** dans les logs
- **Jamais** dans les réponses API

### Masquage en pratique
- Le token est remplacé par `[token-masqué]` partout sauf dans les headers HTTP
- Les IDs SmartThings sont masqués : `abc12345-...` → `abc1***5` (si `SMARTTHINGS_MASK_IDS=true`)
- Les erreurs sont nettoyées de toute trace du token

### Scopes nécessaires (lecture seule)
| Scope | Usage |
|---|---|
| `devices:read` | Lister et lire les appareils |
| `locations:read` | Lister les locations |
| `scenes:read` | Lister les scènes |

> **Ne pas activer** `scenes:execute` dans cette phase.

---

## Architecture

```
server.js
  └── /api/smartthings/*         ← routes/smartthings.js
        ├── GET  /status            ← connector.getStatus()
        ├── GET  /locations         ← connector.listLocations()
        ├── GET  /devices           ← connector.listDevices()
        ├── GET  /devices/:id/status← connector.getDeviceStatus()
        ├── GET  /tv                ← connector.findSamsungTv()
        ├── GET  /scenes            ← connector.listScenes()
        ├── POST /scenes/:id/preview← connector.previewSceneExecution() [JAMAIS /execute]
        └── GET  /safety            ← rapport sécurité complet

server/src/services/media/
  ├── smartThingsSafety.js    ← masquage token/IDs, assertion read-only, headers sécurisés
  └── smartThingsConnector.js ← appels API GET uniquement
```

---

## Variables d'environnement Phase 8

| Variable | Défaut | Rôle |
|---|---|---|
| `SMARTTHINGS_ENABLED` | `false` | Activer SmartThings |
| `SMARTTHINGS_TOKEN` | _(vide)_ | Token confidentiel — jamais commité |
| `SMARTTHINGS_READ_ONLY` | `true` | Mode lecture seule — ne jamais désactiver |
| `SMARTTHINGS_API_BASE_URL` | `https://api.smartthings.com/v1` | URL de base de l'API |
| `SMARTTHINGS_TV_DEVICE_ID` | _(vide)_ | ID de la TV dans SmartThings (optionnel) |
| `SMARTTHINGS_DEFAULT_LOCATION_ID` | _(vide)_ | ID de la location principale (optionnel) |
| `SMARTTHINGS_COMMAND_TIMEOUT_MS` | `5000` | Timeout des requêtes API (ms) |
| `SMARTTHINGS_MASK_IDS` | `true` | Masquer les IDs dans les réponses |
| `SMARTTHINGS_ALLOW_SCENE_EXECUTION` | `false` | Exécution de scènes — toujours false dans cette phase |

---

## Endpoints ajoutés (Phase 8)

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/smartthings/status` | État global SmartThings |
| GET | `/api/smartthings/locations` | Locations (IDs masqués) |
| GET | `/api/smartthings/devices` | Appareils (IDs masqués) |
| GET | `/api/smartthings/devices/:id/status` | Statut d'un appareil |
| GET | `/api/smartthings/tv` | Identifier la TV Samsung |
| GET | `/api/smartthings/scenes` | Scènes (IDs masqués) |
| POST | `/api/smartthings/scenes/:id/preview` | Prévisualiser une scène **sans l'exécuter** |
| GET | `/api/smartthings/safety` | Rapport sécurité complet |

---

## Mode lecture seule — garanties

1. **Aucun POST `/execute`** : l'endpoint `POST /scenes/{id}/execute` n'est jamais appelé
2. **Aucune commande appareil** : `POST /devices/{id}/commands` est bloqué par `assertReadOnlyOperation()`
3. **Aucune règle modifiée** : POST/PUT/DELETE sur `/rules` sont bloqués
4. **Token invisible** : le module `smartThingsSafety.js` garantit que le token n'apparaît jamais en dehors des headers HTTP
5. **IDs masqués** : tous les identifiants SmartThings sont tronqués dans les réponses API et les logs
6. **Timeout court** : 5 secondes par défaut (`SMARTTHINGS_COMMAND_TIMEOUT_MS`)

---

## Opérations autorisées

- `GET /locations`
- `GET /devices`
- `GET /devices/{deviceId}`
- `GET /devices/{deviceId}/status`
- `GET /scenes`

## Opérations bloquées

- `POST /scenes/{sceneId}/execute`
- `POST /devices/{deviceId}/commands`
- `POST /rules`
- `PUT /rules`
- `DELETE /rules`
- Toute commande d'appareil
- Toute modification de scène
- Toute modification de location

---

## Scènes en prévisualisation

`previewSceneExecution(sceneId)` :
1. Appelle uniquement `GET /scenes` pour récupérer les informations de la scène
2. Ne appelle **jamais** `POST /scenes/{id}/execute`
3. Retourne :
   - `sceneId` masqué
   - `sceneName` si disponible
   - `message: "Prévisualisation uniquement — aucune scène exécutée"`
   - `securityWarning: "Exécution désactivée (SMARTTHINGS_ALLOW_SCENE_EXECUTION=false)"`
   - `readOnly: true`

---

## Comportements par état

| État | Cause | Comportement |
|---|---|---|
| `disabled` | `SMARTTHINGS_ENABLED=false` | Instructions d'activation affichées |
| `missing_token` | Token absent dans `.env` | Invite à configurer le token |
| `unauthorized` | Token invalide ou expiré | Message d'erreur, aucune donnée exposée |
| `unavailable` | API inaccessible (réseau) | Message timeout, retry possible |
| `available` | API disponible et token valide | Toutes les fonctionnalités actives |

---

## Mise à jour des scénarios

### Mode Cinéma
- Vérifie si SmartThings voit la TV Samsung (lecture seule)
- Propose une scène SmartThings si disponible (sans l'exécuter)

### Mode Présentation
- Confirme la disponibilité de la TV via SmartThings
- Propose des actions manuelles

### Mode Veille
- Liste la scène "Veille" si disponible dans SmartThings
- Ne l'exécute pas

### Mode Diagnostic réseau
- Résumé SmartThings : statut API, token configuré, appareils détectés, TV détectée, scènes disponibles

---

## Limites actuelles

- Pas d'exécution de scène (Phase 9+)
- Pas de commandes TV (Phase 9+)
- Pas de persistance du cache (rechargé à chaque requête)
- Pas de polling automatique (actualisation manuelle)
- Un seul token par instance (pas de multi-compte)

---

## Comment tester

```powershell
# 1. Dans .env : SMARTTHINGS_ENABLED=true + SMARTTHINGS_TOKEN renseigne
# 2. Redémarrer : npm start
# 3. Tester les endpoints :

# État global
curl http://localhost:3000/api/smartthings/status

# Rapport sécurité
curl http://localhost:3000/api/smartthings/safety

# Locations
curl http://localhost:3000/api/smartthings/locations

# Appareils
curl http://localhost:3000/api/smartthings/devices

# TV Samsung
curl http://localhost:3000/api/smartthings/tv

# Scènes
curl http://localhost:3000/api/smartthings/scenes

# Prévisualiser une scène (sans exécuter)
curl -X POST http://localhost:3000/api/smartthings/scenes/SCENE_ID/preview

# Statut d'un appareil
curl http://localhost:3000/api/smartthings/devices/DEVICE_ID/status

# Intégrations globales (inclut SmartThings)
curl http://localhost:3000/api/integrations/status
```

---

## Prochaine étape — Phase 9

- Exécution de scènes opt-in (avec `SMARTTHINGS_ALLOW_SCENE_EXECUTION=true` et confirmation utilisateur)
- Commandes TV : allumer/éteindre, volume (opt-in strict)
- Cache local des appareils et scènes
- Streaming DLNA vers TV
