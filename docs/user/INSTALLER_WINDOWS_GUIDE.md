# Guide installateur Windows

Ce guide decrit l'installation locale guidee de Sallon-ConnecT sur Windows. La Phase 25 ne cree pas encore de MSI : elle ajoute des scripts PowerShell et des wrappers `.bat` pour installer, reparer ou desinstaller doucement le projet.

## Pre-requis

- Windows avec PowerShell.
- Node.js 22.13 ou plus recent recommande.
- npm disponible.
- Git optionnel.
- Ports 3000 et 3001 libres, ou deja utilises par Sallon-ConnecT.

Verifier les pre-requis :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\install\check-prerequisites.ps1
```

Node.js 22.11 peut afficher un avertissement si le projet fonctionne deja. Node.js absent ou npm absent bloquent l'installation.

## Installation guidee

Depuis la racine du projet :

```powershell
scripts\windows\install\install-sallon-connect.bat
```

Le script :

- verifie les pre-requis ;
- cree `runtime/`, `logs/`, `backups/` et `dist/` si besoin ;
- cree les `.gitkeep` manquants ;
- cree `.env` depuis `.env.example` uniquement si `.env` est absent ;
- cree `frontend/.env.local` depuis `frontend/.env.example` uniquement si absent ;
- lance `npm install` a la racine et dans `frontend/` ;
- lance `npm run build:frontend` ;
- cree les raccourcis Bureau et Menu Demarrer ;
- lance `npm run health` seulement si le backend est actif.

Options utiles :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\install\install-sallon-connect.ps1 -SkipInstallDeps
powershell -ExecutionPolicy Bypass -File scripts\windows\install\install-sallon-connect.ps1 -SkipBuild
powershell -ExecutionPolicy Bypass -File scripts\windows\install\install-sallon-connect.ps1 -NoShortcut
```

Un rapport local est cree dans `logs/install-YYYYMMDD-HHMM.txt`. Ne publiez pas les rapports de `logs/`.

## Premier lancement

L'assistant de premiere configuration pose des questions simples :

```powershell
scripts\windows\install\first-run-wizard.bat
```

Il peut creer les fichiers d'environnement depuis les exemples et les raccourcis. Il ne demande pas de token SmartThings dans la console. Si vous activez SmartThings, modifiez `.env` manuellement et ne partagez jamais son contenu.

## Raccourcis

Le script de raccourcis Menu Demarrer cree un dossier utilisateur `Sallon-ConnecT` avec :

- `Sallon-ConnecT`
- `Ouvrir Dashboard`
- `Arreter Sallon-ConnecT`
- `Statut Sallon-ConnecT`

Aucun droit administrateur n'est demande.

## Reparation

Utilisez la reparation si un dossier local, un `.gitkeep`, un build ou un raccourci manque :

```powershell
scripts\windows\install\repair-sallon-connect.bat
```

Mode leger :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\install\repair-sallon-connect.ps1 -SkipBuild -SkipInstallDeps -NoShortcut
```

La reparation ne supprime pas vos donnees. Elle ne remplace pas `.env` ou `frontend/.env.local` s'ils existent.

## Desinstallation douce

La desinstallation douce ne supprime pas le dossier projet automatiquement :

```powershell
scripts\windows\install\uninstall-sallon-connect.bat
```

Elle demande l'arret local, supprime les raccourcis si presents, puis propose optionnellement de supprimer `logs/`, `backups/`, `runtime/` et `node_modules/`. Chaque suppression demande une confirmation explicite. Par defaut, les donnees sont conservees.

## Securite des fichiers `.env`

- `.env` et `frontend/.env.local` sont locaux et ignores par Git.
- Les scripts ne les ecrasent pas s'ils existent.
- Aucun secret n'est affiche dans les rapports.
- Ne publiez jamais les dossiers `runtime/`, `logs/`, `backups/`, `node_modules/` ou `.next/`.

## Depannage

Si Node.js ou npm est absent, installez Node.js puis relancez le terminal.

Si les ports sont deja utilises, lancez :

```powershell
scripts\windows\status-sallon-connect.bat
scripts\windows\stop-sallon-connect.bat
```

Si un build echoue, relancez :

```powershell
npm run build:frontend
```

Si les raccourcis manquent :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\create-desktop-shortcut.ps1
powershell -ExecutionPolicy Bypass -File scripts\windows\install\create-start-menu-shortcut.ps1
```
