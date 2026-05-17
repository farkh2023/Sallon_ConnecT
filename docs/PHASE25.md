# Phase 25 - Installateur Windows local guide

## Objectif

La Phase 25 ajoute un installateur Windows local guide pour rendre Sallon-ConnecT plus simple a installer, reparer et desinstaller sans MSI, sans service Windows et sans droits administrateur par defaut.

## Scripts installateur

Les scripts sont dans `scripts/windows/install/` :

| Script | Role |
|---|---|
| `check-prerequisites.ps1` | Verifie Windows, PowerShell, Node.js, npm, Git optionnel, ports, espace disque et droits locaux |
| `install-sallon-connect.ps1` | Prepare le projet, cree les fichiers locaux depuis exemples, installe les dependances, build le frontend et cree les raccourcis |
| `first-run-wizard.ps1` | Guide la premiere configuration sans demander de secret dans les logs |
| `create-start-menu-shortcut.ps1` | Cree les raccourcis utilisateur du Menu Demarrer |
| `repair-sallon-connect.ps1` | Repare dossiers, fichiers locaux, dependances, build et raccourcis |
| `uninstall-sallon-connect.ps1` | Desinstallation douce avec confirmations explicites |

Des wrappers `.bat` appellent PowerShell avec `ExecutionPolicy Bypass` pour faciliter l'usage depuis l'Explorateur Windows.

## Securite

- Aucun MSI n'est produit.
- Aucun service Windows n'est installe.
- Aucun droit administrateur n'est demande par defaut.
- `.env` et `frontend/.env.local` ne sont jamais ecrases s'ils existent.
- Aucun token n'est demande ni journalise par l'assistant de premiere configuration.
- Les rapports restent dans `logs/`, dossier ignore par Git.
- `runtime/`, `backups/`, `logs/`, `node_modules/` et `.next/` restent exclus de la publication.

## Installation

Commande principale :

```powershell
scripts\windows\install\install-sallon-connect.bat
```

Options PowerShell :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\install\install-sallon-connect.ps1 -SkipInstallDeps
powershell -ExecutionPolicy Bypass -File scripts\windows\install\install-sallon-connect.ps1 -SkipBuild
powershell -ExecutionPolicy Bypass -File scripts\windows\install\install-sallon-connect.ps1 -NoShortcut
```

## Reparation

La reparation est locale et conservative :

```powershell
scripts\windows\install\repair-sallon-connect.bat
```

Elle recree les dossiers manquants et relance les etapes utiles sans supprimer les donnees utilisateur.

## Desinstallation

La desinstallation douce :

- demande l'arret du hub ;
- retire les raccourcis ;
- propose de supprimer certains dossiers locaux ;
- ne supprime jamais le projet entier automatiquement.

Commande :

```powershell
scripts\windows\install\uninstall-sallon-connect.bat
```

## Packaging

Le ZIP portable inclut les scripts `scripts/windows/install/` et le guide utilisateur `docs/user/INSTALLER_WINDOWS_GUIDE.md`.

Il exclut toujours les fichiers locaux sensibles : `.env`, `frontend/.env.local`, `runtime/*.json`, `backups/*.zip`, `logs/`, `node_modules/`, `.next/` et les cles/certificats.

## Tests

Validations ajoutees ou mises a jour :

- `tests/windows/validate-powershell.ps1` parse recursivement les scripts PowerShell.
- `tests/packaging/portable-zip.test.js` verifie la presence des scripts installateur et du guide dans le ZIP.
- `npm run check:docs` verifie les liens de documentation.

## Limites actuelles

- Pas de MSI.
- Pas de service Windows.
- Pas de mise a jour automatique.
- Les dependances restent installees via npm localement.

## Prochaines etapes

La Phase 26 pourra transformer ce flux en installateur Windows packagable, avec une experience plus proche d'un assistant graphique tout en gardant les garanties local-first.
