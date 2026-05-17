# Phase 17B - Maintenance dependances

## Objectif

La Phase 17B realise une maintenance controlee des dependances sans changement majeur automatique et sans activer d'action sensible.

## Versions

- Node.js: `v22.11.0`
- npm: `10.9.0`

Note: certains paquets frontend signalent une plage moteur recommandee `^20.19.0 || ^22.13.0 || >=24`. Le projet fonctionne avec Node `22.11.0`, mais une mise a jour vers Node `22.13+` reste recommandee.

## Outdated

Racine:

- `dotenv`: actuel `16.6.1`, latest `17.4.2` (majeur)
- `express`: actuel `4.22.2`, latest `5.2.1` (majeur)

Frontend:

- `@types/node`: actuel `20.19.41`, latest `25.8.0` (majeur)
- `jsdom`: actuel `24.1.3`, latest `27.0.1` (majeur)
- `react`: actuel `19.2.4`, latest `19.2.6`
- `react-dom`: actuel `19.2.4`, latest `19.2.6`
- `typescript`: actuel `5.9.3`, latest `6.0.3` (majeur)
- `vitest`: actuel `3.2.4`, latest `4.1.6` (majeur)

Aucune mise a jour majeure n'a ete appliquee automatiquement.

## Audit

Rapports generes:

- `logs/npm-audit-root.json`
- `logs/npm-audit-frontend.json`

Avant `npm audit fix`:

- Racine: 0 vulnerabilite
- Frontend: 2 vulnerabilites moderees

Apres `npm audit fix` sans `--force`:

- Racine: 0 vulnerabilite
- Frontend: 2 vulnerabilites moderees restantes

## Vulnerabilites Restantes

Frontend:

- `postcss <8.5.10`
- via `next`
- severite: moderate
- advisory: XSS via sortie CSS stringify non echappee

npm propose uniquement:

```powershell
npm audit fix --force
```

Cette correction installerait `next@9.3.3`, ce qui est un changement breaking et un downgrade incompatible avec le frontend actuel Next.js 16. Elle n'a donc pas ete appliquee.

## Dependances Modifiees

Aucune dependance n'a ete modifiee par cette maintenance. `npm audit fix` sans `--force` n'a applique aucun changement.

## Commandes Executees

```powershell
node -v
npm -v
npm outdated
cd frontend; npm outdated
npm audit
npm audit --json > logs/npm-audit-root.json
cd frontend; npm audit
cd frontend; npm audit --json > ../logs/npm-audit-frontend.json
npm audit fix
cd frontend; npm audit fix
npm run test:backend
npm run test:frontend
npm run test:packaging
npm run test:windows
npm run build:frontend
npm run check
```

## Verification

`npm run check` passe completement:

- lint frontend OK
- tests backend OK
- tests frontend OK
- test packaging OK
- test PowerShell OK
- build frontend OK

## Recommandations

- Mettre Node.js a jour vers `22.13+`.
- Surveiller une release Next.js qui embarque une version corrigee de `postcss` sans downgrade.
- Ne pas utiliser `npm audit fix --force` tant qu'il propose `next@9.3.3`.
- Planifier les mises a jour majeures (`express@5`, `dotenv@17`, `typescript@6`, `vitest@4`, `jsdom@27`) dans une phase dediee avec tests complets.
