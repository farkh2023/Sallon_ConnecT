# Phase 10 — Commandes TV Samsung via SmartThings

## Objectif

Ajouter des commandes TV basiques via SmartThings, en opt-in strict :
- Uniquement pour une TV explicitement allowlistée
- Commandes autorisées prédéfinies (switch.on, switch.off, mediaPlayback.*)
- Confirmation utilisateur obligatoire avant chaque commande
- Audit local de toutes les tentatives
- Volume, keypad et changement de source bloqués par défaut

---

## Différence scène SmartThings vs commande TV directe

| | Scène SmartThings (Phase 9) | Commande TV directe (Phase 10) |
|---|---|---|
| API appelée | `POST /scenes/{id}/execute` | `POST /devices/{id}/commands` |
| Cible | N'importe quel appareil configuré dans la scène | TV uniquement (allowlist) |
| Granularité | Groupe d'actions | Commande unique (capability.command) |
| Contrôle fins | Non (dépend de la scène) | Oui (commande précise) |
| Risque | Faible (scènes pré-approuvées) | Maîtrisé (allowlist + confirmation) |
| Audit | `runtime/smartthings-scene-audit.json` | `runtime/smartthings-tv-audit.json` |

---

## Gardes d'exécution (ordre obligatoire)

1. **SmartThings activé** — `SMARTTHINGS_ENABLED=true` requis
2. **Commandes TV activées** — `SMARTTHINGS_TV_COMMANDS_ENABLED=true`
3. **TV dans l'allowlist** — `deviceId` présent dans `SMARTTHINGS_TV_DEVICE_ALLOWLIST`
4. **Commande autorisée** — `command` dans `SMARTTHINGS_TV_COMMAND_ALLOWLIST` + familles non bloquées
5. **Confirmation** — code exact `SMARTTHINGS_TV_CONFIRMATION_CODE`
6. **Audit activé** — `SMARTTHINGS_TV_AUDIT_ENABLED=true`

---

## Variables `.env` Phase 10

| Variable | Défaut | Obligatoire | Description |
|---|---|---|---|
| `SMARTTHINGS_TV_COMMANDS_ENABLED` | `false` | Oui | Activer les commandes TV (opt-in) |
| `SMARTTHINGS_TV_COMMANDS_REQUIRE_CONFIRMATION` | `true` | Oui | Exiger confirmation |
| `SMARTTHINGS_TV_CONFIRMATION_CODE` | `CONFIRMER_TV` | Recommandé | Code de confirmation |
| `SMARTTHINGS_TV_DEVICE_ALLOWLIST` | _(vide)_ | Oui | IDs TV autorisées (virgule) |
| `SMARTTHINGS_TV_COMMAND_ALLOWLIST` | `switch.on,switch.off,...` | Non | Commandes autorisées |
| `SMARTTHINGS_TV_AUDIT_ENABLED` | `true` | Oui | Audit local — toujours actif |
| `SMARTTHINGS_TV_AUDIT_PATH` | `runtime/smartthings-tv-audit.json` | Non | Chemin fichier audit |
| `SMARTTHINGS_TV_BLOCK_VOLUME_COMMANDS` | `true` | Obligatoire | Bloquer volume/mute |
| `SMARTTHINGS_TV_BLOCK_KEYPAD_INPUT` | `true` | Obligatoire | Bloquer saisie clavier |
| `SMARTTHINGS_TV_BLOCK_SOURCE_CHANGE` | `true` | Obligatoire | Bloquer changement source |

---

## Allowlist TV

Renseigner les IDs SmartThings réels des TV autorisées (obtenus via `GET /api/smartthings/devices`).

```dotenv
SMARTTHINGS_TV_DEVICE_ALLOWLIST=tv-device-id-1,tv-device-id-2
```

**Règles :**
- Ne jamais mettre d'ID inconnu ou non vérifié
- Appareils sensibles (serrure, caméra, alarme...) rejetés par sécurité
- Allowlist vide = aucune commande TV possible

---

## Allowlist commandes

```dotenv
SMARTTHINGS_TV_COMMAND_ALLOWLIST=switch.on,switch.off,mediaPlayback.play,mediaPlayback.pause,mediaPlayback.stop
```

Format : `capability.command` (capability SmartThings + point + commande).

---

## Commandes autorisées par défaut

| Commande | Action |
|---|---|
| `switch.on` | Allumer la TV |
| `switch.off` | Éteindre la TV |
| `mediaPlayback.play` | Lancer la lecture |
| `mediaPlayback.pause` | Mettre en pause |
| `mediaPlayback.stop` | Arrêter la lecture |

---

## Commandes bloquées

| Commande | Raison |
|---|---|
| `audioVolume.setVolume` | Volume bloqué (`SMARTTHINGS_TV_BLOCK_VOLUME_COMMANDS=true`) |
| `audioVolume.volumeUp` | Volume bloqué |
| `audioVolume.volumeDown` | Volume bloqué |
| `audioMute.mute` | Volume bloqué |
| `audioMute.unmute` | Volume bloqué |
| `keypadInput.sendKey` | Keypad bloqué (`SMARTTHINGS_TV_BLOCK_KEYPAD_INPUT=true`) |
| `mediaInputSource.setInputSource` | Source bloquée (`SMARTTHINGS_TV_BLOCK_SOURCE_CHANGE=true`) |
| Toute commande inconnue | Non présente dans l'allowlist |

---

## Confirmation utilisateur

Code par défaut : `CONFIRMER_TV` (configurable dans `.env`).

Le code est vérifié côté serveur — jamais révélé dans les messages d'erreur.

---

## Audit local

Stocké dans `runtime/smartthings-tv-audit.json`.

Chaque entrée contient :

```json
{
  "auditId":          "tv-1716840000000-abc1",
  "deviceIdMasked":   "abc1***c",
  "deviceName":       "Samsung TV",
  "command":          "switch.on",
  "requestedAt":      "2026-05-16T12:00:00.000Z",
  "executedAt":       "2026-05-16T12:00:00.050Z",
  "status":           "executed",
  "reason":           "Mode cinéma activé",
  "confirmationUsed": true,
  "source":           "Sallon-ConnecT",
  "tokenExposed":     false,
  "restrictedToTv":   true
}
```

Maximum 100 entrées (rotation automatique). Jamais de token, jamais d'ID complet si masquage activé.

---

## Endpoints Phase 10

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/smartthings/tv/command-policy` | Politique commandes TV |
| `GET` | `/api/smartthings/tv/allowed-devices` | TV allowlistées (IDs masqués) |
| `GET` | `/api/smartthings/tv/:id/capabilities` | Capabilities de la TV |
| `POST` | `/api/smartthings/tv/:id/commands/preview` | Prévisualiser une commande |
| `POST` | `/api/smartthings/tv/:id/commands/execute` | Exécuter une commande |
| `GET` | `/api/smartthings/tv/audit` | Historique audit TV |
| `DELETE` | `/api/smartthings/tv/audit` | Vider l'audit TV |

---

## Procédure de test

### 1. Activer Phase 10 dans `.env`

```dotenv
SMARTTHINGS_ENABLED=true
SMARTTHINGS_TOKEN = <token-placeholder>
SMARTTHINGS_TV_COMMANDS_ENABLED=true
SMARTTHINGS_TV_CONFIRMATION_CODE=CONFIRMER_TV
SMARTTHINGS_TV_DEVICE_ALLOWLIST=your-tv-device-id
SMARTTHINGS_TV_AUDIT_ENABLED=true
```

### 2. Démarrer le serveur

```powershell
npm start
```

### 3. Tester les endpoints

```powershell
# Politique commandes TV
curl http://localhost:3000/api/smartthings/tv/command-policy

# TV allowlistées
curl http://localhost:3000/api/smartthings/tv/allowed-devices

# Capabilities TV (remplacer TV_ID)
curl http://localhost:3000/api/smartthings/tv/TV_ID/capabilities

# Prévisualiser une commande (jamais d'exécution réelle)
curl -X POST http://localhost:3000/api/smartthings/tv/TV_ID/commands/preview `
  -H "Content-Type: application/json" `
  -d "{""command"":""mediaPlayback.pause""}"

# Exécuter une commande (réelle — TV allowlistée + confirmation)
curl -X POST http://localhost:3000/api/smartthings/tv/TV_ID/commands/execute `
  -H "Content-Type: application/json" `
  -d "{""command"":""mediaPlayback.pause"",""confirmationCode"":""CONFIRMER_TV"",""reason"":""Test contrôlé""}"

# Audit TV
curl http://localhost:3000/api/smartthings/tv/audit

# Vider l'audit
curl -X DELETE http://localhost:3000/api/smartthings/tv/audit
```

---

## Comportements refusés (tests de blocage)

```powershell
# Commandes TV désactivées (SMARTTHINGS_TV_COMMANDS_ENABLED=false)
# → { success: false, status: 'disabled', error: 'Commandes TV désactivées par sécurité.' }

# TV absente de l'allowlist
# → { success: false, status: 'blocked', error: 'TV non autorisée...' }

# Commande hors allowlist
# → { success: false, status: 'blocked', error: 'Commande TV non autorisée.' }

# Mauvais code de confirmation
# → { success: false, status: 'blocked', error: 'Code de confirmation incorrect.' }

# Commande de volume (bloquée par défaut)
curl -X POST http://localhost:3000/api/smartthings/tv/TV_ID/commands/execute `
  -H "Content-Type: application/json" `
  -d "{""command"":""audioVolume.setVolume"",""confirmationCode"":""CONFIRMER_TV""}"
# → { success: false, status: 'blocked', error: '...famille volume bloquée...' }
```

---

## Limites actuelles

- Aucun retour d'état TV en temps réel (pas de polling)
- La commande `switch.on` peut ne pas fonctionner si la TV est entièrement hors tension (WakeOnLAN non implémenté)
- Volume, keypad et changement source restent bloqués même si ajoutés à l'allowlist (doublon de sécurité)
- Pas de file d'attente de commandes — une seule commande à la fois
- Phase 10 n'autorise PAS les commandes via les scénarios en mode automatique

---

## Prochaines étapes

- Phase 11 : Tableau de bord état TV en temps réel (polling statut switch/mediaPlayback)
- Phase 12 : Interface de télécommande visuelle complète
- Phase 13 : Intégration assistant vocal local

---

## Phases précédentes

- [Phase 9 — Exécution scènes SmartThings](PHASE9.md)
- [Phase 8 — SmartThings lecture seule](PHASE8.md)
