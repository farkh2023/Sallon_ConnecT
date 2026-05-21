# Phase 33 — Release locale stable + packaging final

## Objectif

Preparer une release locale stable, portable et documentee de Sallon-ConnecT apres validation de l'observabilite, SSE, notifications et diagnostics.

## Version

| Champ | Valeur |
|---|---|
| Version stable | `0.4.0` |
| Tag propose | `v0.4.0` |
| Date release | 2026-05-22 |
| Node recommande | `>=22.13.0` |
| Build number | Genere par `build-release.ps1` au format `yyyyMMdd-HHmmss` |

## Scripts ajoutes

| Script | Role |
|---|---|
| `scripts/windows/release/build-release.ps1` | Lint, tests, build, backend isole, packaging, verification, SHA256, metadata, rapport |
| `scripts/windows/release/verify-release.ps1` | Inspection ZIP, structure, exclusions, local-only, secrets probables |
| `scripts/windows/release/start-release.ps1` | Lancement local production avec installation/build si necessaire |

## Packaging

Le ZIP portable contient les sources et scripts necessaires, mais pas les donnees privees ni les dependances installees.

Structure attendue :

```text
frontend/
server/
docs/
scripts/
logs/.gitkeep
runtime/.gitkeep
backups/.gitkeep
dist/.gitkeep
```

Exclusions renforcees :

- `.env`, `.env.local`, `frontend/.env.local` ;
- `node_modules`, `.next`, tests, coverage, caches, temp ;
- `runtime/*.json` ;
- `logs/*.json`, `logs/*.txt`, `logs/*.log` ;
- `backups/*.zip`, `backups/*.json` ;
- cles et certificats.

## Validation securite

- Diagnostics : `security.localOnly=true`, cloud services et push externe desactives.
- SSE : origines `localhost:3000` et `localhost:3001`.
- Exports JSON : locaux et limites aux donnees non sensibles.
- Packaging : verification des entrees interdites et scan de secrets probables.

## Limites connues

- La release portable n'est pas un binaire autonome : Node.js reste requis.
- Les dependances npm sont reinstallees sur la machine cible.
- Le build frontend production peut etre regenere au premier lancement release.
- WebSocket, multi-machines, companion mobile et plugins restent hors Phase 33.
