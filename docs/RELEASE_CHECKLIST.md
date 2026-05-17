# Release Checklist - Sallon-ConnecT

Checklist locale avant commit, tag ou publication GitHub.

## 1. Qualite

- [ ] `npm run check` passe.
- [ ] `npm run test:backend` passe.
- [ ] `npm run test:frontend` passe.
- [ ] `npm run test:packaging` passe.
- [ ] `npm run test:windows` passe.
- [ ] `npm run build:frontend` passe.
- [ ] `npm run health` passe si le backend est actif, sinon warning non bloquant.

## 2. Package Portable

- [ ] Construire le ZIP portable si une distribution locale est necessaire.
- [ ] Verifier que le ZIP ne contient pas `.env`, runtime JSON, logs, backups, `node_modules`, `.next`, cles ou certificats.
- [ ] Conserver les artefacts locaux dans `dist/`, sans les ajouter a Git.

## 3. Preflight GitHub

```powershell
powershell -ExecutionPolicy Bypass -File scripts\release\preflight-github.ps1
```

- [ ] Aucun fichier interdit suivi par Git.
- [ ] Aucun secret probable dans les fichiers suivis.
- [ ] Aucun chemin personnel Windows ou macOS dans les fichiers suivis.
- [ ] Rapport genere dans `logs/`.

## 4. Documentation

- [ ] `README.md` a jour.
- [ ] `CHANGELOG.md` contient l'entree `0.1.0`.
- [ ] `ROADMAP.md` liste les phases 23 a 28.
- [ ] `SECURITY.md` et `docs/SECURITY_MODEL.md` a jour.
- [ ] `CONTRIBUTING.md` rappelle l'interdiction des secrets.
- [ ] `docs/LOCAL_SETUP.md`, `docs/ARCHITECTURE.md`, `docs/VERSIONING.md` a jour.
- [ ] `VERSION` contient `0.1.0`.

## 5. Git

- [ ] `git status` ne montre que les fichiers attendus.
- [ ] Les fichiers ignores restent locaux.
- [ ] Aucun remote n'est cree automatiquement.
- [ ] Aucun push n'est execute automatiquement.

Commandes recommandees apres validation :

```powershell
git status
git add .
git commit -m "Prepare v0.1.0 GitHub release"
git tag v0.1.0
```

Le tag et la publication GitHub doivent rester des actions manuelles confirmees.

---

## Section v0.1.0 — Validation Release Phase 26

Checklist specifique pour la preparation et publication de la version v0.1.0.

### Qualite et Tests

- [ ] `npm run check` passe (lint + tests + packaging + PowerShell + build).
- [ ] `npm run test:backend` : 0 echec.
- [ ] `npm run test:frontend` : 0 echec (warning ESLint `_f` corrige).
- [ ] `npm run test:packaging` passe.
- [ ] `npm run test:windows` passe.
- [ ] `npm run build:frontend` passe.
- [ ] `npm run health` passe si le backend est actif, sinon warning non bloquant.

### Preflight et Preparation

```powershell
powershell -ExecutionPolicy Bypass -File scripts\release\preflight-github.ps1
powershell -ExecutionPolicy Bypass -File scripts\release\prepare-release.ps1
```

- [ ] preflight-github.ps1 : 0 echec (aucun secret, aucun fichier interdit).
- [ ] prepare-release.ps1 : OK.

### Artefacts Release

```powershell
powershell -ExecutionPolicy Bypass -File scripts\release\build-release-artifacts.ps1
```

- [ ] ZIP portable genere dans `dist/`.
- [ ] ZIP verifie : aucun `.env`, `runtime/*.json`, `logs/`, `node_modules`, `.next`, cles PEM.
- [ ] Checksum SHA256 genere : `dist/Sallon-ConnecT-v0.1.0-checksums.txt`.

### Verification Checksum

```powershell
Get-FileHash dist\Sallon-ConnecT-Portable-v0.1.0.zip -Algorithm SHA256
```

- [ ] Hash correspond a celui dans `dist/Sallon-ConnecT-v0.1.0-checksums.txt`.

### Fichiers Release

- [ ] `docs/releases/v0.1.0.md` presente et complete.
- [ ] `VERSION` = `0.1.0`.
- [ ] `CHANGELOG.md` contient l'entree `[0.1.0]`.
- [ ] `README.md` mentionne v0.1.0 et la section Release.

### Verification Git

- [ ] `git status` : working tree propre.
- [ ] Aucun fichier `.env`, `runtime/`, `logs/`, `node_modules` suivi par Git.

### Check Final

```powershell
powershell -ExecutionPolicy Bypass -File scripts\release\final-release-check.ps1
```

- [ ] final-release-check.ps1 : 0 echec.

### Commit et Tag (manuel)

```powershell
git status
git add .
git commit -m "Prepare GitHub release v0.1.0"
git tag v0.1.0
```

- [ ] Commit cree localement.
- [ ] Tag `v0.1.0` cree localement.

### Publication GitHub (manuelle, quand pret)

```powershell
git remote add origin URL_DU_DEPOT
git push -u origin main
git push origin v0.1.0
```

- [ ] Branche `main` poussee.
- [ ] Tag `v0.1.0` pousse.
- [ ] GitHub Release creee manuellement sur github.com.
- [ ] ZIP portable joint a la release.
- [ ] Fichier checksums joint a la release.
- [ ] Notes de release issues de `docs/releases/v0.1.0.md`.
