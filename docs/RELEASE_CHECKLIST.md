# Checklist de publication — Sallon-ConnecT

À compléter avant chaque publication sur GitHub.

---

## 1. Qualité du code

- [ ] `npm run check` passe à 100% (lint + tests backend + tests frontend + packaging + build)
- [ ] Aucun test ignoré avec `.skip` ou `.only`
- [ ] Aucune console.log de débogage laissée

---

## 2. Sécurité

- [ ] `.env` n'est pas dans `git ls-files` (`git ls-files .env` → vide)
- [ ] `frontend/.env.local` n'est pas tracké
- [ ] `runtime/*.json` non tracké
- [ ] `backups/*.zip` non tracké
- [ ] `logs/*.log`, `logs/*.txt` non tracqués
- [ ] Aucun token Bearer dans les fichiers commités
- [ ] Aucun chemin absolu (`C:\Users\`, `/Users/`) dans les fichiers commités
- [ ] Aucun IMEI, numéro de série, IP complète
- [ ] Script preflight : `powershell -ExecutionPolicy Bypass -File scripts/release/preflight-github.ps1` → PASS

---

## 3. Documentation

- [ ] `README.md` à jour (badges CI, version, quick start)
- [ ] `CHANGELOG.md` mis à jour pour la nouvelle version
- [ ] `VERSION` mis à jour (ex. `0.1.0`)
- [ ] `ROADMAP.md` reflète le statut actuel
- [ ] `docs/ARCHITECTURE.md` à jour
- [ ] `docs/SECURITY_MODEL.md` à jour
- [ ] `docs/LOCAL_SETUP.md` à jour

---

## 4. Package

- [ ] `package.json` version = version dans `VERSION`
- [ ] `package.json` contient `"private": true`
- [ ] `package.json` contient `"engines": { "node": ">=22.0.0" }`
- [ ] `package.json` version = `CHANGELOG.md` entrée la plus récente

---

## 5. CI/CD

- [ ] `.github/workflows/tests.yml` est à jour
- [ ] Le workflow tourne sur `ubuntu-latest` ou `windows-latest` avec Node 22.x
- [ ] Le workflow inclut : lint, test:backend, test:frontend, test:packaging, build:frontend

---

## 6. Commit et tag

```powershell
# Vérifier l'état
git status
git log --oneline -5

# Commit final (si nécessaire)
git add <fichiers spécifiques>
git commit -m "chore(release): prepare v0.1.0"

# Tag
git tag -a v0.1.0 -m "Release v0.1.0 — Prototype local complet"

# Pousser (seulement après validation complète)
git push origin main
git push origin v0.1.0
```

---

## 7. Après publication

- [ ] Vérifier que les Actions GitHub passent (CI vert)
- [ ] Vérifier que les fichiers sensibles ne sont pas dans le dépôt distant
- [ ] Créer une Release GitHub depuis le tag v0.1.0
- [ ] Ajouter les notes de release depuis `CHANGELOG.md`

---

## Script de préparation automatisé

```powershell
powershell -ExecutionPolicy Bypass -File scripts/release/prepare-release.ps1
```

Ce script exécute automatiquement les étapes 1, 2 et 5 et génère un rapport dans `logs/`.
