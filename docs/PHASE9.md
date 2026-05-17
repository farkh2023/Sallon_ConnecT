# Phase 9 — Exécution contrôlée de scènes SmartThings

## Objectif

Permettre l'exécution opt-in de scènes SmartThings pré-approuvées, avec :
- Allowlist explicite dans `.env` (aucune scène exécutable par défaut)
- Code de confirmation obligatoire avant chaque exécution
- Audit local immuable de toutes les tentatives (succès et échecs)
- Blocage absolu des commandes directes d'appareils et des appareils sensibles

La Phase 8 (lecture seule) reste entièrement préservée — Phase 9 est une couche optionnelle par-dessus.

---

## Architecture Phase 9

```
Frontend (app.js)
  ↓  loadSmartThingsExecutionPolicy()    → GET  /api/smartthings/scenes/execution-policy
  ↓  loadExecutableScenes()             → GET  /api/smartthings/scenes/executable
  ↓  confirmSmartThingsExecution()      → POST /api/smartthings/scenes/:id/execute
  ↓  loadSmartThingsSceneAudit()        → GET  /api/smartthings/scenes/audit
  ↓  clearSmartThingsSceneAudit()       → DELETE /api/smartthings/scenes/audit

Backend (smartthings.js routes)
  ↓  getSceneExecutionPolicy()         ← smartThingsConnector.js
  ↓  getExecutableScenes()             ← filtre allowlist + masquage IDs
  ↓  executeScene(id, opts)            ← 5 gardes + audit
  ↓  getSceneAuditHistory()            ← lecture runtime/smartthings-scene-audit.json
  ↓  clearSceneAuditHistory()          ← reset fichier audit

Sécurité (smartThingsSafety.js)
  validateSceneExecutionEnabled()
  validateSceneInAllowlist()
  validateConfirmationCode()
  blockSensitiveDeviceTypes()
  blockDeviceCommands()
  sanitizeSceneExecutionResult()
  buildSceneAuditEntry()
```

---

## Gardes d'exécution (ordre obligatoire)

1. **enabled** — `SMARTTHINGS_ALLOW_SCENE_EXECUTION=true` requis
2. **allowlist** — `sceneId` présent dans `SMARTTHINGS_SCENE_ALLOWLIST`
3. **confirmation** — code exact (`CONFIRMER` par défaut) présent dans le body
4. **audit activé** — `SMARTTHINGS_SCENE_AUDIT_ENABLED=true` requis
5. **device commands bloqués** — `SMARTTHINGS_BLOCK_DEVICE_COMMANDS=true`

Si l'un quelconque échoue → réponse 403, audit d'échec enregistré, aucun appel API SmartThings.

---

## Variables `.env` Phase 9

| Variable | Défaut | Obligatoire | Description |
|---|---|---|---|
| `SMARTTHINGS_ALLOW_SCENE_EXECUTION` | `false` | Oui | Activer l'exécution (opt-in explicite) |
| `SMARTTHINGS_SCENE_EXECUTION_REQUIRE_CONFIRMATION` | `true` | Oui | Exiger code de confirmation |
| `SMARTTHINGS_SCENE_EXECUTION_CONFIRMATION_CODE` | `CONFIRMER` | Recommandé | Code de confirmation — changer en production |
| `SMARTTHINGS_SCENE_ALLOWLIST` | _(vide)_ | Oui | IDs de scènes autorisées, séparés par virgule |
| `SMARTTHINGS_SCENE_AUDIT_ENABLED` | `true` | Oui | Activer l'audit local |
| `SMARTTHINGS_SCENE_AUDIT_PATH` | `runtime/smartthings-scene-audit.json` | Non | Chemin du fichier audit |
| `SMARTTHINGS_BLOCK_DEVICE_COMMANDS` | `true` | Obligatoire | Bloquer commandes directes |
| `SMARTTHINGS_BLOCK_SENSITIVE_DEVICES` | `true` | Obligatoire | Bloquer appareils sensibles |

> **Ne jamais mettre `SMARTTHINGS_BLOCK_DEVICE_COMMANDS=false` ni `SMARTTHINGS_BLOCK_SENSITIVE_DEVICES=false`.**

---

## Exemple `.env` Phase 9 (sans vraie donnée)

```dotenv
# Phase 8 — toujours requis
SMARTTHINGS_ENABLED=true
SMARTTHINGS_TOKEN = <token-placeholder>     # jamais commité, jamais dans le code
SMARTTHINGS_READ_ONLY=true
SMARTTHINGS_MASK_IDS=true

# Phase 9 — opt-in exécution
SMARTTHINGS_ALLOW_SCENE_EXECUTION=true
SMARTTHINGS_SCENE_EXECUTION_REQUIRE_CONFIRMATION=true
SMARTTHINGS_SCENE_EXECUTION_CONFIRMATION_CODE=CONFIRMER
# Renseigner les IDs réels des scènes autorisées (obtenus via GET /api/smartthings/scenes)
SMARTTHINGS_SCENE_ALLOWLIST=scene-id-1,scene-id-2
SMARTTHINGS_SCENE_AUDIT_ENABLED=true
SMARTTHINGS_SCENE_AUDIT_PATH=runtime/smartthings-scene-audit.json
SMARTTHINGS_BLOCK_DEVICE_COMMANDS=true
SMARTTHINGS_BLOCK_SENSITIVE_DEVICES=true
```

---

## Endpoints Phase 9

### `GET /api/smartthings/scenes/execution-policy`

Retourne la politique d'exécution courante.

```json
{
  "enabled": false,
  "confirmationRequired": true,
  "allowlistCount": 0,
  "auditEnabled": true,
  "deviceCommandsBlocked": true,
  "sensitiveDevicesBlocked": true
}
```

### `GET /api/smartthings/scenes/executable`

Retourne les scènes de l'allowlist (intersection avec les scènes réelles SmartThings).
IDs masqués dans `sceneIdDisplay`, IDs originaux dans `sceneId` (pour l'exécution).

```json
{
  "enabled": false,
  "scenes": [],
  "allowlistCount": 0,
  "message": "L'exécution de scènes n'est pas activée."
}
```

### `POST /api/smartthings/scenes/:id/execute`

Body requis :
```json
{
  "confirmationCode": "CONFIRMER",
  "reason": "Description de la raison (max 200 chars)"
}
```

Réponse succès :
```json
{
  "success": true,
  "sceneId": "abc1***c",
  "message": "Scène exécutée avec succès.",
  "auditId": "abc1***c-1716840000000",
  "executedAt": "2026-05-16T12:00:00.000Z"
}
```

Réponse blocage (403) :
```json
{
  "success": false,
  "error": "SCENE_NOT_IN_ALLOWLIST",
  "message": "Cette scène n'est pas dans l'allowlist d'exécution."
}
```

### `GET /api/smartthings/scenes/audit`

Retourne l'historique des tentatives d'exécution (max 100 entrées, plus récent en premier).

```json
{
  "entries": [
    {
      "id": "abc1***c-1716840000000",
      "sceneId": "abc1***c",
      "sceneName": "Cinéma",
      "success": true,
      "reason": "Test contrôlé",
      "timestamp": "2026-05-16T12:00:00.000Z",
      "tokenExposed": false,
      "deviceCommandsUsed": false
    }
  ],
  "count": 1,
  "lastUpdatedAt": "2026-05-16T12:00:00.000Z"
}
```

### `DELETE /api/smartthings/scenes/audit`

Vide l'historique d'audit. Réinitialise `entries: []`.

---

## Commandes de test Phase 9

```powershell
# Politique d'exécution
curl http://localhost:3000/api/smartthings/scenes/execution-policy

# Scènes exécutables (depuis allowlist)
curl http://localhost:3000/api/smartthings/scenes/executable

# Exécuter une scène (remplacer SCENE_ID par un ID réel de l'allowlist)
curl -X POST http://localhost:3000/api/smartthings/scenes/SCENE_ID/execute `
  -H "Content-Type: application/json" `
  -d "{""confirmationCode"":""CONFIRMER"",""reason"":""Test contrôlé depuis Sallon-ConnecT""}"

# Lire l'audit
curl http://localhost:3000/api/smartthings/scenes/audit

# Vider l'audit
curl -X DELETE http://localhost:3000/api/smartthings/scenes/audit

# Tester un blocage (mauvais code de confirmation)
curl -X POST http://localhost:3000/api/smartthings/scenes/SCENE_ID/execute `
  -H "Content-Type: application/json" `
  -d "{""confirmationCode"":""MAUVAIS"",""reason"":""Test blocage""}"
```

---

## Garanties de sécurité Phase 9

| Garantie | Mécanisme |
|---|---|
| Aucune commande directe d'appareil | `blockDeviceCommands()` dans safety.js |
| Appareils sensibles bloqués | Pattern regex `/lock\|camera\|alarm\|.../i` |
| Aucune exécution sans allowlist | `validateSceneInAllowlist()` en garde 2 |
| Aucune exécution sans confirmation | `validateConfirmationCode()` en garde 3 |
| Token jamais exposé | Masqué dans toutes les réponses et logs |
| IDs masqués en affichage | `sceneIdDisplay` = `maskSmartThingsId(sceneId)` |
| Audit de toutes les tentatives | Succès ET échecs enregistrés |
| Audit max 100 entrées | Oldest-first rotation automatique |
| Pas de modification de règles SmartThings | `assertReadOnlyOperation()` bloque les appels non-POST |
| Phase 8 lecture seule préservée | Aucune route modifiée — Phase 9 est additive |

---

## Comportements par état

### `SMARTTHINGS_ALLOW_SCENE_EXECUTION=false` (défaut)

- `GET /scenes/execution-policy` → `{ enabled: false, ... }`
- `GET /scenes/executable` → `{ enabled: false, scenes: [], message: "..." }`
- `POST /scenes/:id/execute` → 403 `SCENE_EXECUTION_DISABLED`
- Phase 8 entièrement fonctionnelle

### `SMARTTHINGS_ALLOW_SCENE_EXECUTION=true` + `SMARTTHINGS_SCENE_ALLOWLIST=` (vide)

- `GET /scenes/executable` → `{ scenes: [], allowlistCount: 0 }`
- `POST /scenes/:id/execute` → 403 `SCENE_NOT_IN_ALLOWLIST`

### `SMARTTHINGS_ALLOW_SCENE_EXECUTION=true` + allowlist renseignée + confirmation correcte

- `GET /scenes/executable` → liste des scènes filtrées (IDs masqués)
- `POST /scenes/:id/execute` → exécution réelle + audit success

---

## Fichier d'audit

Stocké dans `runtime/smartthings-scene-audit.json` (créé automatiquement).

```json
{
  "entries": [],
  "lastUpdatedAt": null
}
```

- Maximum 100 entrées — les plus anciennes sont supprimées automatiquement
- Jamais de token, jamais d'IP, jamais de données personnelles dans l'audit
- `tokenExposed: false` et `deviceCommandsUsed: false` sur chaque entrée

---

## Limites connues

- L'exécution réelle nécessite un token SmartThings avec scope `scenes:execute`
- Un timeout de 5000ms s'applique à l'appel API d'exécution (`SMARTTHINGS_COMMAND_TIMEOUT_MS`)
- L'audit est local (pas de synchronisation cloud)
- Phase 9 n'ajoute pas de contrôle TV direct — uniquement des scènes (qui peuvent inclure la TV)

---

## Phases précédentes

- [Phase 8 — SmartThings lecture seule](PHASE8.md)
