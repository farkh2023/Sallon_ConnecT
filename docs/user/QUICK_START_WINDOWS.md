# Quick Start Windows

Ce guide permet de demarrer Sallon-ConnecT sur Windows avec les scripts fournis.

## Prerequis

- Windows 10 ou 11.
- Node.js 22.13 ou plus recent.
- npm installe avec Node.js.
- PowerShell disponible.

Verifier Node :

```powershell
node --version
npm --version
```

## Installer les dependances

Depuis le dossier du projet :

```powershell
scripts\windows\install-deps.bat
```

Ce script installe les dependances racine et frontend. Il ne cree pas de secret et ne publie rien.

## Demarrer Sallon-ConnecT

```powershell
scripts\windows\start-sallon-connect.bat
```

Le backend ecoute sur http://localhost:3000 et le frontend sur http://localhost:3001.

## Ouvrir le dashboard

```powershell
scripts\windows\open-dashboard.bat
```

Si le navigateur ne s'ouvre pas, ouvrez manuellement http://localhost:3001.

## Verifier le statut

```powershell
scripts\windows\status-sallon-connect.bat
```

Le statut indique si les processus locaux repondent.

## Arreter proprement

```powershell
scripts\windows\stop-sallon-connect.bat
```

Utilisez ce script avant de fermer Windows ou avant de changer de configuration.

## Creer un raccourci Bureau

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\create-desktop-shortcut.ps1
```

Le raccourci ouvre le dashboard local. Il ne contient pas de secret.

## Creer un ZIP portable

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\package-portable.ps1
```

Le ZIP est cree dans `dist/`. Il exclut les secrets, les dependances installees, les logs bruts, les fichiers runtime et les sauvegardes locales.
