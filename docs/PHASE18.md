# Phase 18 - Observabilite globale

## Objectif

La Phase 18 ajoute un tableau d'observabilite local pour Sallon-ConnecT. Il donne un resume de l'etat backend, frontend, securite, runtime, logs, tests, scheduler, notifications et integrations sans exposer de donnees sensibles.

## Architecture

Backend:

- `server/src/services/observability/healthCollector.js`
- `server/src/services/observability/securityCollector.js`
- `server/src/services/observability/runtimeCollector.js`
- `server/src/services/observability/testCollector.js`
- `server/src/services/observability/logCollector.js`
- `server/src/services/observability/overviewCollector.js`
- `server/src/routes/observability.js`

Frontend:

- `frontend/src/hooks/useObservability.ts`
- `frontend/src/components/observability/ObservabilityPanel.tsx`
- `HealthOverview.tsx`
- `SecurityOverview.tsx`
- `RuntimeOverview.tsx`
- `TestsOverview.tsx`
- `LogsOverview.tsx`
- `ObservabilityMetric.tsx`
- `ObservabilityStatusBadge.tsx`

## Endpoints ajoutes

Tous les endpoints sont locaux et servent des reponses `no-store`.

| Methode | Endpoint | Role |
|---|---|---|
| GET | `/api/observability/overview` | Synthese globale Phase 18 |
| GET | `/api/observability/health` | Uptime, Node, memoire, ports locaux |
| GET | `/api/observability/security` | Gardes locaux et exclusions sensibles |
| GET | `/api/observability/runtime` | Compteurs runtime/logs/dist sans contenu |
| GET | `/api/observability/tests` | Scripts et fichiers de tests detectes |
| GET | `/api/observability/logs` | Noms surs, tailles et dates des logs |
| GET | `/api/observability/safety` | Drapeaux de securite stricts |

## Collecteurs backend

- `healthCollector`: ne fait aucun appel externe. Il collecte uptime, version Node, memoire, port backend, frontend attendu sur `localhost:3001`, disponibilite logique de `/api/health` et phase.
- `securityCollector`: verifie `.gitignore`, service worker, SmartThings opt-in, commandes TV opt-in, streaming avec confirmation, ADB/DLNA lecture seule et blocage scheduler.
- `runtimeCollector`: inspecte `runtime/`, `logs/`, `dist/`, `.gitkeep`, nombre de JSON runtime, taille arrondie et dernier ZIP portable. Il ne lit jamais le contenu des fichiers runtime.
- `testCollector`: lit `package.json` pour detecter les scripts de validation et verifie les fichiers de configuration de tests/CI/documentation.
- `logCollector`: liste uniquement nombre, noms masques, tailles arrondies et dates de modification.
- `overviewCollector`: agrege les collecteurs et peut notifier les transitions vers `warning` ou `error`.

## Securite

Garanties Phase 18:

- aucun contenu `.env` lu ou renvoye;
- aucun contenu runtime ou log brut expose;
- chemins absolus masques;
- IP locales completes masquees;
- identifiants longs et noms suspects masques;
- aucun appel cloud;
- aucun test execute depuis l'API;
- service worker configure pour ne pas cacher `/api/*`;
- reponses observability en `Cache-Control: no-store`.

`GET /api/observability/safety` retourne:

```json
{
  "localOnly": true,
  "secretsMasked": true,
  "noCloudTelemetry": true,
  "sensitiveActionsBlocked": true,
  "apiCacheDisabled": true,
  "runtimeContentHidden": true
}
```

## Frontend

La section `Observabilite` est ajoutee dans le dashboard Next.js et dans la navigation. Elle affiche:

- statut global;
- backend et frontend attendus;
- integrations;
- securite;
- runtime;
- logs;
- tests;
- scheduler;
- notifications;
- dernier refresh;
- bouton `Actualiser`.

Le raccourci clavier `H` ouvre la section Observabilite.

## Scheduler snapshot

Action autorisee ajoutee:

```text
observability.snapshot
```

Elle appelle la logique collector, enregistre un resume non sensible dans l'historique scheduler et ne lance aucun test ni action sensible.

## Notifications

Le collecteur global notifie uniquement lorsqu'un statut passe a `warning` ou `error`. La deduplication existante du moteur de notifications limite le spam, et aucun refresh identique ne cree de nouvelle notification de transition.

## Tests ajoutes

Backend:

- `tests/backend/observability.test.js`

Frontend:

- `frontend/src/__tests__/components/ObservabilityPanel.test.tsx`

Ces tests verifient les endpoints, le rendu loading/ok/warning/error, le bouton refresh et l'absence d'exposition de valeurs sensibles dans les reponses ou l'interface.

## Commandes de validation

```powershell
npm run test:backend
npm run test:frontend
npm run build:frontend
npm run check
```

Script optionnel:

```powershell
npm run health
```

## Limites actuelles

- Le frontend attendu `localhost:3001` n'est pas pingue depuis le backend pour eviter des appels supplementaires.
- Les tests ne sont jamais lances par l'API; seuls les scripts et fichiers sont detectes.
- Les logs sont listes sans contenu, meme si cela limite le diagnostic detaille.

## Prochaines etapes

- Ajouter un historique local compact des snapshots observability.
- Afficher une tendance des derniers statuts sans exposer les logs bruts.
- Planifier une montee de version dependances separee pour les majors documentes en Phase 17B.
