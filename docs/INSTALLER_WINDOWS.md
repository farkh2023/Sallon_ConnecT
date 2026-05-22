# Installateur Windows — Sallon-ConnecT v0.4.0

Guide technique de l'installateur autonome Windows basé sur Inno Setup 6.

## Prérequis

### Machine de build (développeur)

| Outil | Version | Commande |
|-------|---------|----------|
| Node.js | ≥ 22.13.0 | `node --version` |
| npm / pnpm | dernière LTS | `npm --version` |
| Inno Setup | 6.x | `winget install JRSoftware.InnoSetup` |
| Git | optionnel | — |

### Machine cible (utilisateur final)

| Outil | Version minimum | Note |
|-------|----------------|------|
| Windows | 10 1809 (17763) ou 11 | Architecture 64-bit |
| Node.js | ≥ 22.13.0 | Requis — l'installateur bloque si absent |

## Installation d'Inno Setup

### Option 1 — winget (recommandée)

```powershell
winget install JRSoftware.InnoSetup
```

Redémarrer le terminal après installation.

### Option 2 — Téléchargement manuel

1. Aller sur https://jrsoftware.org/isdl.php
2. Télécharger **Inno Setup 6.x** (pas la version Unicode séparée — elle est incluse).
3. Lancer l'installateur avec les options par défaut.
4. Chemin attendu : `C:\Program Files (x86)\Inno Setup 6\ISCC.exe`

### Option 3 — Chocolatey

```powershell
choco install innosetup
```

## Construction de l'installateur

### Commande standard

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\installer\build-installer.ps1
```

Cela effectue dans l'ordre :
1. Lint (`pnpm lint`)
2. Tests (`pnpm test`)
3. Build frontend (`pnpm build`)
4. Tests backend (`pnpm test:backend`)
5. Tests Windows (`pnpm test:windows`)
6. Compilation Inno Setup (`iscc.exe Sallon-ConnecT.iss`)
7. Calcul SHA256 et génération du checksum

### Options

| Paramètre | Effet |
|-----------|-------|
| `-SkipValidation` | Ignore lint/tests/build avant compilation |
| `-SkipTests` | Ignore les tests mais conserve le build |
| `-Version X.Y.Z` | Force la version (défaut : lecture de `VERSION`) |

### Construction rapide (sans tests)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\installer\build-installer.ps1 -SkipValidation
```

### Build depuis l'IDE Inno Setup

1. Ouvrir Inno Setup IDE (lanceur Windows)
2. Menu Fichier > Ouvrir
3. Sélectionner `scripts\windows\installer\Sallon-ConnecT.iss`
4. Menu Build > Compile (Ctrl+F9)
5. L'installateur est généré dans `dist\`

## Artefacts générés

| Fichier | Description |
|---------|-------------|
| `dist\Sallon-ConnecT-Setup-0.4.0.exe` | Installateur autonome |
| `dist\Sallon-ConnecT-Setup-v0.4.0-sha256.txt` | Somme de contrôle SHA256 |
| `dist\build-installer-*.log` | Journal de build |

## Vérification de l'artefact

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\installer\verify-installer.ps1
```

Vérifications effectuées :
- Existence du fichier `.exe`
- Extension correcte
- Taille minimale (> 500 Ko)
- SHA256 calculé et affiché
- Cohérence avec le fichier checksum
- Version dans le nom de fichier
- Fraîcheur de l'artefact (< 24h)
- Présence du script `.iss` source
- Absence de `.env` dans `dist/`

Mode strict (avertissements = erreurs) :
```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\installer\verify-installer.ps1 -Strict
```

## Installation côté utilisateur

### Étapes

1. Double-cliquer sur `Sallon-ConnecT-Setup-0.4.0.exe`.
2. Si SmartScreen apparaît : cliquer **Informations complémentaires** → **Exécuter quand même**.
3. L'assistant vérifie Node.js automatiquement.
4. Choisir le dossier d'installation (défaut : `%LOCALAPPDATA%\Sallon-ConnecT`).
5. Choisir les raccourcis à créer.
6. Cliquer **Installer**.
7. Attendre la fin de `npm install` et du build frontend (2–5 minutes).
8. Cliquer **Terminer**.

### Premier lancement

Via le raccourci Menu Démarrer → **Démarrer Sallon-ConnecT**

Ou manuellement :
```
%LOCALAPPDATA%\Sallon-ConnecT\scripts\windows\start-sallon-connect.bat
```

### URLs locales

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3001 |
| Backend API | http://localhost:3000/api/health |

## Mise à jour

Il n'existe pas encore de mise à jour automatique. Pour mettre à jour :

1. Désinstaller l'ancienne version (Menu Démarrer → Désinstaller Sallon-ConnecT).
2. Sauvegarder `%LOCALAPPDATA%\Sallon-ConnecT\.env` si personnalisé.
3. Lancer le nouvel installateur.
4. Restaurer `.env` si nécessaire.

## Désinstallation

### Via l'installateur

Menu Démarrer → **Désinstaller Sallon-ConnecT**

Ou via Paramètres Windows → Applications → Sallon-ConnecT → Désinstaller.

### Vérification post-désinstallation

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\installer\uninstall-check.ps1
```

Vérifie :
- Suppression des raccourcis Menu Démarrer et Bureau
- Absence de processus actifs
- Entrées registre
- État du dossier d'installation

### Données conservées à la désinstallation

Les dossiers suivants ne sont **pas** supprimés automatiquement pour protéger vos données :

| Dossier | Contenu |
|---------|---------|
| `logs/` | Journaux d'application |
| `runtime/` | État courant |
| `backups/` | Sauvegardes locales |
| `.env` | Configuration locale |

Pour supprimer complètement :
```powershell
Remove-Item -Path "$env:LOCALAPPDATA\Sallon-ConnecT" -Recurse -Force
```

## Sécurité

### Ce que l'installateur n'embarque pas

- Fichiers `.env`, `.env.local`, `.env.production` (secrets réels)
- `node_modules/`, `frontend/.next/` (trop volumineux et régénérables)
- `*.pem`, `*.key`, `*.p12`, `*.crt` (certificats)
- `secrets.json`, `config.local.json`
- Contenu de `logs/`, `runtime/*.json`, `backups/*.zip`
- Dossier `.git/`

### Ce que l'installateur crée automatiquement

- `.env` depuis `.env.example` (si absent) — aucun secret réel
- `frontend/.env.local` depuis `frontend/.env.example` (si absent)
- Dossiers vides : `runtime/`, `logs/`, `backups/`, `dist/`

### SmartScreen

L'installateur n'est pas signé avec un certificat de code commercial. Windows SmartScreen peut afficher un avertissement. C'est normal pour un logiciel local non distribué via le Microsoft Store.

## Dépannage

### "Node.js est introuvable"

Installer Node.js 22.x depuis https://nodejs.org/fr/ puis relancer l'installateur. Si Node.js est bien installé mais non reconnu, redémarrer la session Windows.

### "SmartScreen a protégé votre PC"

Cliquer **Informations complémentaires** → **Exécuter quand même**. L'installateur est sûr mais non signé.

### Le build frontend échoue après installation

```powershell
cd %LOCALAPPDATA%\Sallon-ConnecT
npm run build:frontend
```

### Les ports 3000 ou 3001 sont occupés

```powershell
%LOCALAPPDATA%\Sallon-ConnecT\scripts\windows\status-sallon-connect.bat
%LOCALAPPDATA%\Sallon-ConnecT\scripts\windows\stop-sallon-connect.bat
```

### npm install échoue pendant l'installation

Vérifier la connexion réseau. Relancer l'installation ou exécuter manuellement :
```powershell
cd %LOCALAPPDATA%\Sallon-ConnecT
npm install
cd frontend && npm install
```

## Limites connues

| Limite | Contournement |
|--------|---------------|
| Node.js non installé automatiquement | Installer depuis nodejs.org avant le setup |
| Pas de signature de code | SmartScreen gérable manuellement |
| npm install requis post-install | 2–5 min selon réseau — automatique |
| Pas de mise à jour in-place | Désinstaller / réinstaller |
| Architecture 64-bit uniquement | Pas de support 32-bit |
| Windows 10 1809 minimum | Windows 7/8 non supportés |
