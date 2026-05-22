# Phase 39 — Auto-update local securise

## Objectif

Ajouter un systeme de mise a jour locale securise, manuel par defaut, permettant de verifier les nouvelles releases GitHub, telecharger l'artefact, verifier son SHA256, appliquer la mise a jour avec backup, et effectuer un rollback si necessaire.

## Contexte

| Critere | Valeur |
|---------|--------|
| Version | 0.4.0 |
| Base | Phase 38 — assistant premier lancement valide |
| Source updates | GitHub Releases (farkh2023/Sallon_ConnecT) |
| Mode | Manuel uniquement — aucun auto-update |
| Admin requis | Non |
| Local-only | Oui (hors verification GitHub release) |

## Fichiers crees

| Fichier | Role |
|---------|------|
| `scripts/windows/update/check-update.ps1` | Verifie GitHub release vs version locale |
| `scripts/windows/update/download-update.ps1` | Telecharge assets, verifie SHA256 |
| `scripts/windows/update/apply-update.ps1` | Applique la mise a jour avec backup et confirmation |
| `scripts/windows/update/rollback-update.ps1` | Restaure la version precedente depuis backup |
| `scripts/windows/update/update-status.ps1` | Statut : versions, telechargements, backups |
| `scripts/windows/update/README.md` | Guide rapide |
| `docs/PHASE39.md` | Ce document |
| `docs/SECURE_UPDATE.md` | Guide technique complet |

## Fichiers modifies

| Fichier | Modification |
|---------|-------------|
| `scripts/windows/tray/Sallon-ConnecT-Tray.ps1` | Item "Verifier mise a jour..." dans le menu |
| `docs/INDEX.md` | Liens Phase 39 et SECURE_UPDATE.md |
| `CHANGELOG.md` | Entree Phase 39 |
| `ROADMAP.md` | Phase 39 marquee Fait |
| `docs/RELEASE_CHECKLIST.md` | Section 16 Phase 39 |

## Architecture du flux

```
check-update.ps1       — API GitHub, compare version
       |
download-update.ps1    — Telechargement ZIP + sha256, verification SHA256
       |
apply-update.ps1       — Backup, extraction, copie selective, rapport
       |
rollback-update.ps1    — Restauration depuis runtime/update-backups/
```

## Securite

| Garantie | Implementation |
|----------|---------------|
| GitHub officiel uniquement | URL validee : `https://github.com/farkh2023/` |
| Extensions autorisees | `.zip`, `.txt`, `.json` seulement |
| SHA256 obligatoire | apply refuse si `verified=false` dans verification.json |
| Aucun auto-update | Jamais de telechargement ou apply sans action explicite |
| Donnees preservees | logs/, runtime/, backups/, .env, data/ |
| Backup avant apply | runtime/update-backups/<timestamp>/ |
| Aucune telemetrie | Aucune donnee transmise hors appel API GitHub |
| Aucun secret | Rapports sans chemins sensibles ni tokens |

## Structure runtime

```
runtime/
  updates/
    0.4.1/
      Sallon-ConnecT-Portable-*.zip
      Sallon-ConnecT-v0.4.1-sha256.txt
      Sallon-ConnecT-v0.4.1-release.json
      verification.json          -- SHA256, statut verifie
      download-log.txt           -- journal telechargement
      apply-report.json          -- rapport apply (si applique)
      extracted/                 -- extraction temporaire
  update-backups/
    20260522-103045/
      server.js
      server/
      scripts/
      package.json
      VERSION
      backup-manifest.json       -- fromVersion, toVersion, timestamp
```

Tous ces fichiers sont exclus du ZIP portable (`runtime/*.json`).

## Integration tray (Phase 37)

Item ajoute au menu clic-droit :
- **Verifier mise a jour...** → ouvre `check-update.ps1` dans un terminal visible

Aucune notification automatique. L'utilisateur initie toujours la verification.

## Validations

| Validation | Resultat |
|------------|---------|
| `pnpm lint` | OK |
| `pnpm test` | 228/228 frontend |
| `pnpm test:backend` | 114/114 backend |
| `pnpm build` | OK |
| `pnpm test:windows` | 39/39 scripts valides |
| `pnpm release:build` | ZIP portable intact |

## Limites connues

| Limite | Detail |
|--------|--------|
| Connexion requise pour check/download | API GitHub non accessible hors ligne |
| npm install non automatique | Si package.json change, relancer npm install manuellement |
| Rollback code uniquement | Les donnees utilisateur ne sont pas rollbackees |
| Un backup par apply | Pas d'historique multi-versions (dernier backup utilisé) |
| Extensions limitees | Seuls .zip .txt .json sont acceptes comme assets |
