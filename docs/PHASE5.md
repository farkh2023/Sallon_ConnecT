# Phase 5 — Orchestrateur de scénarios intelligents

## Objectif

Ajouter un moteur d'orchestration de scénarios intelligents et renforcer les connecteurs multimédias
(ADB, DLNA, SmartThings) avec des fonctions de lecture seule progressives.
Cette phase reste entièrement locale, sécurisée et réversible.

---

## Architecture — Orchestrateur de scénarios

```
server.js
  └── /api/scenarios/*    ← routes/scenariosRuntime.js
        ├── GET  /runtime               ← scenarioEngine.getCurrentRuntime()
        ├── GET  /history               ← scenarioEngine.getHistory()
        ├── DELETE /history             ← scenarioEngine.clearHistory()
        ├── POST /:id/preview           ← scenarioEngine.preview(id)
        ├── POST /:id/run               ← scenarioEngine.run(id, mode)
        └── POST /:id/stop              ← scenarioEngine.stop(id)

server/src/services/scenarios/
  ├── scenarioRegistry.js   ← définitions statiques des 6 scénarios
  └── scenarioEngine.js     ← logique d'exécution, historique, modes

runtime/
  └── scenario-history.json ← historique local (max 50 entrées)
```

---

## Scénarios disponibles

| ID            | Nom                     | Étapes | Sécurité |
|---------------|-------------------------|--------|----------|
| `cinema`      | Mode Cinéma             | 6      | Sûr      |
| `travail`     | Mode Travail            | 5      | Sûr      |
| `presentation`| Mode Présentation       | 5      | Sûr      |
| `famille`     | Mode Famille            | 6      | Sûr      |
| `veille`      | Mode Veille             | 5      | Sûr      |
| `diagnostic`  | Mode Diagnostic réseau  | 5      | Sûr      |

---

## Endpoints ajoutés (Phase 5)

| Méthode  | Route                           | Description                                    |
|----------|---------------------------------|------------------------------------------------|
| GET      | `/api/scenarios/runtime`        | État de tous les scénarios exécutables         |
| GET      | `/api/scenarios/history`        | Historique local des exécutions                |
| DELETE   | `/api/scenarios/history`        | Vide l'historique local                        |
| POST     | `/api/scenarios/:id/preview`    | Aperçu des étapes sans exécution               |
| POST     | `/api/scenarios/:id/run`        | Exécute le scénario (simulation par défaut)    |
| POST     | `/api/scenarios/:id/stop`       | Arrête un scénario en cours                    |

---

## Modes d'exécution

### Mode `simulated` (défaut)

- Aucune action réelle sur les appareils
- Aucun envoi de média vers la TV
- Aucune commande ADB, DLNA ou SmartThings
- Chaque étape retourne un message simulé
- Historique enregistré localement

### Mode `assisted`

- Activé via `{ "mode": "assisted" }` dans le body POST
- Retourne des instructions manuelles pour chaque étape
- Aucune action automatique sensible
- Journalise uniquement le statut général

### Mode `live` (bloqué)

- Refusé si `SCENARIO_LIVE_ENABLED=false` (défaut)
- Retourne une erreur explicite avec conseil de sécurité
- Non implémenté dans cette phase même si activé

---

## Sécurité ADB (Phase 5B)

Le connecteur ADB est enrichi de fonctions de **lecture seule** :

| Fonction          | Description                                    |
|-------------------|------------------------------------------------|
| `listDevices()`   | Liste les appareils ADB détectés               |
| `getDeviceModel()`| Fabricant, modèle, version Android             |
| `getBatteryInfo()`| Niveau de batterie, état de charge             |
| `getStorageInfo()`| Espace total / utilisé / libre (en Ko)         |
| `getMediaSummary()`| Nombre de photos/vidéos (comptage seulement)  |

**Contraintes absolues :**
- `ADB_ENABLED=false` par défaut
- Aucune extraction de fichier réel
- Aucune copie, aucune suppression
- Aucune lecture de contenu privé
- `ADB_DEVICE_ID` facultatif — jamais de numéro de série réel

---

## Sécurité DLNA (Phase 5C)

Le connecteur DLNA utilise le module natif `dgram` (UDP/SSDP) :

| Fonction                | Description                          |
|-------------------------|--------------------------------------|
| `discoverRenderers()`   | Découverte des lecteurs UPnP locaux  |
| `discoverMediaServers()`| Découverte des serveurs UPnP locaux  |

**Contraintes absolues :**
- `DLNA_ENABLED=false` par défaut
- Découverte locale uniquement (multicast LAN)
- Timeout court configurable (`DLNA_DISCOVERY_TIMEOUT_MS=3000`)
- Aucun envoi de média
- Aucun contrôle de TV

---

## Sécurité SmartThings (Phase 5D)

Le connecteur SmartThings appelle l'API en lecture seule :

| Fonction                    | Description                                |
|-----------------------------|--------------------------------------------|
| `listDevices()`             | Liste des appareils SmartThings            |
| `getTvStatus()`             | État de la TV (allumée/éteinte)            |
| `listScenes()`              | Liste des scènes disponibles               |
| `previewSceneExecution(id)` | Aperçu d'une scène sans exécution réelle   |

**Contraintes absolues :**
- `SMARTTHINGS_ENABLED=false` par défaut
- `SMARTTHINGS_TOKEN` uniquement dans `.env` (jamais dans le code)
- Token masqué dans tous les logs
- Aucune exécution de scène réelle dans cette phase
- Aucune commande envoyée à la TV

---

## Historique local

**Fichier :** `runtime/scenario-history.json`

Chaque entrée contient :

```json
{
  "scenarioId":    "cinema",
  "scenarioName":  "Mode Cinéma",
  "mode":          "simulated",
  "startedAt":     "2026-05-16T10:00:00.000Z",
  "finishedAt":    "2026-05-16T10:00:00.050Z",
  "status":        "completed",
  "stepsExecuted": 6,
  "warnings":      [],
  "source":        "scenarioEngine"
}
```

- Maximum 50 entrées (les plus anciennes sont supprimées automatiquement)
- Aucune donnée sensible stockée

---

## Variables d'environnement Phase 5

| Variable                       | Défaut   | Rôle                                         |
|--------------------------------|----------|----------------------------------------------|
| `SCENARIO_LIVE_ENABLED`        | `false`  | Débloquer le mode live (risque élevé)         |
| `SCENARIO_HISTORY_ENABLED`     | `true`   | Activer l'historique local                    |
| `ADB_DEVICE_ID`                | _(vide)_ | ID optionnel de l'appareil ADB                |
| `DLNA_DISCOVERY_TIMEOUT_MS`    | `3000`   | Timeout de découverte DLNA en millisecondes   |
| `SMARTTHINGS_TV_DEVICE_ID`     | _(vide)_ | ID de la TV Samsung dans SmartThings          |
| `SMARTTHINGS_DEFAULT_LOCATION_ID` | _(vide)_ | Localisation SmartThings par défaut       |

---

## Limites actuelles

- Mode live non implémenté (intentionnel — phase de préparation)
- ADB : aucune liste de photos réelles (comptage uniquement)
- DLNA : découverte seulement, pas de streaming
- SmartThings : lecture seule, aucune commande TV

---

## Prochaine étape — Phase 6 : Hub IA

- Agents IA spécialisés (LLM local ou API Claude)
- Résumés automatiques de contenus multimédias
- Commandes vocales (Web Speech API)
- Notifications push locales
- Déclencheurs temporels pour les scénarios
