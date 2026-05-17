# Installation locale — Sallon-ConnecT

## Prérequis

| Outil | Version minimale | Vérification |
|---|---|---|
| Node.js | 22.13+ | `node --version` |
| npm | 10.x | `npm --version` |
| PowerShell | 5.1+ | `$PSVersionTable.PSVersion` |
| Git | 2.x | `git --version` |

---

## Installation

### 1. Cloner le dépôt

```powershell
git clone https://github.com/farkh2023/Sallon-ConnecT.git
cd Sallon-ConnecT
```

### 2. Configurer l'environnement

```powershell
copy .env.example .env
```

Éditer `.env` avec vos valeurs. **Ne jamais commiter ce fichier.**

Variables importantes :

| Variable | Description | Défaut |
|---|---|---|
| `PORT` | Port backend | `3000` |
| `SMARTTHINGS_ENABLED` | Activer SmartThings | `false` |
| `SMARTTHINGS_TOKEN` | Token Samsung (optionnel) | — |
| `ADB_ENABLED` | Activer ADB | `false` |
| `DLNA_ENABLED` | Activer DLNA | `false` |
| `MEDIA_STREAMING_ENABLED` | Activer streaming | `false` |
| `BACKUP_ENABLED` | Activer les sauvegardes | `true` |
| `BACKUP_CONFIRMATION_CODE` | Code confirmation restauration | `CONFIRMER_BACKUP` |
| `SCHEDULER_AUTO_START` | Démarrage scheduler automatique | `false` |

### 3. Installer les dépendances

```powershell
# Backend
npm install

# Frontend
cd frontend
npm install
cd ..
```

### 4. Lancer le projet

```powershell
npm run dev
```

Ouvre deux serveurs :
- **Backend** : http://localhost:3000
- **Frontend** : http://localhost:3001

---

## Ports utilisés

| Service | Port | URL |
|---|---|---|
| Backend Express | 3000 | http://localhost:3000 |
| Frontend Next.js | 3001 | http://localhost:3001 |

---

## Structure des dossiers créés automatiquement

```
runtime/          ← créé au premier lancement (non versionné)
backups/          ← créé à la première sauvegarde (non versionné)
logs/             ← créé au premier log (non versionné)
```

---

## Lancer les tests

```powershell
# Suite complète
npm run check

# Tests individuels
npm run test:backend      # 94 tests Jest
npm run test:frontend     # 46 tests Vitest
npm run test:packaging    # validation ZIP portable
npm run test:windows      # syntaxe PowerShell
```

---

## Dépannage

### Le frontend ne démarre pas

```powershell
cd frontend && npm install && cd ..
npm run dev
```

### Le backend répond "EADDRINUSE" sur le port 3000

Un autre processus utilise le port. Changer le port dans `.env` :
```
PORT=3002
```
Et ajuster `frontend/.env.local` :
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3002
```

### Les intégrations ne répondent pas

Vérifier que les variables opt-in sont activées dans `.env` :
```
SMARTTHINGS_ENABLED=true
ADB_ENABLED=true
DLNA_ENABLED=true
```

### Les tests de profils échouent

Les tests utilisent des répertoires isolés dans `tests/.runtime/`. Si le répertoire `runtime/` contient des données corrompues, les supprimer ne casse pas les tests (ils ont leur propre isolation).

### La sauvegarde échoue

- Vérifier que `BACKUP_ENABLED=true` dans `.env`
- Vérifier que le dossier `backups/` est accessible en écriture
- Consulter `runtime/backup-audit.json` pour les erreurs récentes

---

## Variables frontend

Copier `frontend/.env.example` → `frontend/.env.local` :

```powershell
copy frontend\.env.example frontend\.env.local
```

| Variable | Description | Valeur typique |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | URL du backend | `http://localhost:3000` |

---

## Vérification avant publication GitHub

```powershell
powershell -ExecutionPolicy Bypass -File scripts/release/preflight-github.ps1
```

Ce script vérifie qu'aucun fichier sensible n'est inclus dans le suivi Git.
