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
