# Phase 13 — Tâches planifiées (Scheduler)

## Objectif

Moteur de tâches planifiées **100 % local** intégré à Sallon-ConnecT.  
Aucun cron système, aucun service cloud, aucun push externe.  
Toutes les tâches sont des actions read-only et non-destructives.

---

## Architecture

```
server/src/services/scheduler/
├── schedulerSafety.js   — liste blanche / liste noire des actions
├── schedulerStore.js    — persistance JSON (schedules + history)
├── schedulerActions.js  — implémentations des 10 actions autorisées
└── schedulerEngine.js   — moteur tick-based (setInterval)

server/src/routes/scheduler.js — 11 endpoints REST
```

Le moteur utilise `setInterval` avec un intervalle configurable (`SCHEDULER_TICK_MS`, 30 s par défaut).  
Chaque tick vérifie les tâches dont `nextRunAt <= maintenant` et les exécute séquentiellement.

---

## Actions autorisées

| `actionType`               | Description                                |
|----------------------------|--------------------------------------------|
| `system.healthCheck`       | Vérifie l'état général du serveur          |
| `devices.refreshStatus`    | Rafraîchit la liste des appareils          |
| `dlna.discover`            | Lance une découverte DLNA/UPnP             |
| `adb.readOnlyDiagnostics`  | Diagnostic ADB en lecture seule            |
| `media.scanLibrary`        | Scan de la médiathèque locale autorisée    |
| `notifications.cleanup`    | Nettoie les notifications anciennes        |
| `notifications.summary`    | Résumé périodique des notifications        |
| `scenarios.preview`        | Aperçu des scénarios disponibles           |
| `integrations.statusCheck` | Vérifie l'état de toutes les intégrations  |
| `streaming.libraryStatus`  | Statut de la médiathèque streaming         |

## Actions bloquées (par défaut et non contournables)

- `smartthings.scene.execute` — exécution de scène SmartThings
- `smartthings.tv.command` — commande TV directe
- `streaming.play` — lecture automatique de média
- `file.delete`, `file.move` — modification de fichiers personnels
- `adb.pull`, `adb.push` — transfert de fichiers ADB
- `network.aggressiveScan` — scan réseau agressif

---

## Types de planification

| Type       | Paramètre requis           | Exemple                        |
|------------|----------------------------|---------------------------------|
| `interval` | `intervalMinutes` (1–1440) | Toutes les 30 minutes           |
| `daily`    | `time` (HH:MM)             | Chaque jour à 20:00             |
| `weekly`   | `time` + `daysOfWeek`      | Lundi et vendredi à 08:00       |
| `manual`   | aucun                      | Déclenchement manuel uniquement |

---

## Tâches créées par défaut

| Nom                    | Action                     | Schedule         | Activée |
|------------------------|----------------------------|------------------|---------|
| Health check local     | `system.healthCheck`       | Interval 30 min  | Oui     |
| Résumé notifications   | `notifications.summary`    | Daily 20:00      | Non     |
| Nettoyage notifications| `notifications.cleanup`    | Daily 23:00      | Non     |
| Statut intégrations    | `integrations.statusCheck` | Interval 60 min  | Non     |
| Diagnostic appareils   | `devices.refreshStatus`    | Interval 30 min  | Non     |

---

## Endpoints REST

| Méthode | Route                               | Description                         |
|---------|-------------------------------------|-------------------------------------|
| GET     | `/api/scheduler/status`             | État du moteur (running/stopped)    |
| GET     | `/api/scheduler/safety`             | Politiques de sécurité              |
| GET     | `/api/scheduler/actions`            | Liste blanche + liste noire         |
| GET     | `/api/scheduler/schedules`          | Toutes les tâches                   |
| POST    | `/api/scheduler/schedules`          | Créer une tâche                     |
| GET     | `/api/scheduler/schedules/:id`      | Détail d'une tâche                  |
| PATCH   | `/api/scheduler/schedules/:id`      | Modifier une tâche                  |
| PATCH   | `/api/scheduler/schedules/:id/enable`  | Activer                          |
| PATCH   | `/api/scheduler/schedules/:id/disable` | Désactiver                       |
| POST    | `/api/scheduler/schedules/:id/run`  | Exécuter manuellement               |
| DELETE  | `/api/scheduler/schedules/:id`      | Supprimer                           |
| GET     | `/api/scheduler/history`            | Historique des exécutions           |
| DELETE  | `/api/scheduler/history`            | Vider l'historique                  |

---

## Variables d'environnement

| Variable                         | Défaut                           | Description                        |
|----------------------------------|----------------------------------|------------------------------------|
| `SCHEDULER_ENABLED`              | `true`                           | Active le moteur                   |
| `SCHEDULER_TICK_MS`              | `30000`                          | Intervalle de vérification (ms)    |
| `SCHEDULER_STORE_PATH`           | `runtime/schedules.json`         | Fichier de persistance des tâches  |
| `SCHEDULER_HISTORY_PATH`         | `runtime/schedule-history.json`  | Fichier historique                 |
| `SCHEDULER_MAX_HISTORY`          | `200`                            | Nombre max d'entrées d'historique  |
| `SCHEDULER_NOTIFY_ON_SUCCESS`    | `true`                           | Notif Phase 12 en cas de succès    |
| `SCHEDULER_NOTIFY_ON_FAILURE`    | `true`                           | Notif Phase 12 en cas d'échec      |
| `SCHEDULER_ALLOW_SENSITIVE_ACTIONS` | `false`                       | Garder `false` — jamais `true`     |
| `SCHEDULER_DEFAULT_TIMEZONE`     | `Europe/Paris`                   | Fuseau pour daily/weekly           |
| `SCHEDULER_AUTO_START`           | `true`                           | Démarrage auto du moteur           |

---

## Sécurité

- **Anti-doublon** : un `Set _inFlight` empêche deux exécutions parallèles d'une même tâche.
- **Imports différés** : tous les connecteurs dans `schedulerActions.js` utilisent `require()` lazy pour éviter les dépendances circulaires.
- **Données sensibles** : aucun token, chemin absolu, IP ou ID complet dans les logs ou l'historique.
- **Actions sensibles** : bloquées par `schedulerSafety.blockSensitiveAction()` avant chaque exécution manuelle ou automatique.
- **Intégration Phase 12** : chaque exécution génère une notification locale (succès ou échec).

---

## Persistance

| Fichier                          | Contenu                                    |
|----------------------------------|--------------------------------------------|
| `runtime/schedules.json`         | Liste des tâches configurées               |
| `runtime/schedule-history.json`  | Historique des 200 dernières exécutions    |
