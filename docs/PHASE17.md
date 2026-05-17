# Phase 17 - Suite de tests automatises

## Objectif

La Phase 17 ajoute une suite de tests automatises locale pour securiser les evolutions futures de Sallon-ConnecT sans appeler les integrations reelles.

Les tests n'utilisent aucun token reel, ne lancent pas ADB, ne declenchent pas de decouverte DLNA agressive, n'appellent pas SmartThings, n'executent aucune scene, n'envoient aucune commande TV et ne lancent aucun streaming reel.

## Architecture Tests

Backend:

- Jest
- Supertest
- tests Node.js locaux
- runtime de test isole dans `tests/.runtime`

Frontend:

- Vitest
- React Testing Library
- jsdom
- fetch mocke

Windows:

- validation syntaxique PowerShell via AST
- aucun script sensible execute par le test

Packaging:

- test Node qui inspecte le ZIP portable existant ou le genere si absent
- verification des exclusions sensibles

## Tests Backend

Fichiers:

- `tests/backend/health.test.js`
- `tests/backend/notifications.test.js`
- `tests/backend/scheduler.test.js`
- `tests/backend/smartthings-safety.test.js`
- `tests/backend/tv-commands-safety.test.js`
- `tests/backend/streaming-safety.test.js`
- `tests/backend/adb-safety.test.js`
- `tests/backend/dlna-safety.test.js`

Les tests couvrent les endpoints de sante, notifications, scheduler et les modules de safety.

## Tests Securite

Fichiers:

- `tests/integration/api-contracts.test.js`
- `tests/integration/security-regression.test.js`

Ils verifient les contrats JSON des endpoints sensibles, l'absence de fuites courantes et les regles du service worker.

## Tests Frontend

Fichiers:

- `frontend/src/__tests__/api.test.ts`
- `frontend/src/__tests__/safety.test.ts`
- `frontend/src/__tests__/components/AppShell.test.tsx`
- `frontend/src/__tests__/components/OfflineStatus.test.tsx`
- `frontend/src/__tests__/components/NotificationsPanel.test.tsx`
- `frontend/src/__tests__/components/SchedulerPanel.test.tsx`

Les appels reseau sont mockes. Aucun backend reel ni service worker reel n'est requis.

## Tests Packaging

Fichier:

- `tests/packaging/portable-zip.test.js`

Le test verifie la presence de:

- `README.md`
- `.env.example`
- `frontend/.env.example`
- `scripts/windows/start-sallon-connect.bat`
- `runtime/.gitkeep`
- `logs/.gitkeep`

Il refuse:

- `.env`
- `.env.local`
- `frontend/.env.local`
- `.git`
- `node_modules`
- `.next`
- `runtime/*.json`
- `logs/*.log`
- `logs/*.txt`
- `*.pem`
- `*.key`

## Tests Windows

Fichier:

- `tests/windows/validate-powershell.ps1`

Le script parse `scripts/windows/*.ps1` avec l'AST PowerShell et echoue si une syntaxe est invalide.

## Commandes

```powershell
npm test
npm run test:backend
npm run test:frontend
npm run test:packaging
npm run test:windows
npm run build:frontend
npm run check
```

## CI

Workflow:

- `.github/workflows/tests.yml`

Il tourne sur Windows avec Node.js 22.x, installe les dependances avec `npm ci`, puis execute lint, tests backend, tests frontend, tests Windows et build frontend.

## Limites

- Les tests frontend restent unitaires et ne remplacent pas un parcours Playwright.
- Les tests packaging inspectent le ZIP portable local; ils peuvent le generer si absent.
- Les tests de safety privilegient les gardes de securite et les contrats, pas les integrations reelles.

## Prochaines Etapes

- Ajouter des tests E2E Playwright pour les parcours PWA/TV.
- Ajouter une couverture de code si le projet adopte un seuil qualite.
- Ajouter un job CI packaging qui publie l'archive uniquement apres verification.
