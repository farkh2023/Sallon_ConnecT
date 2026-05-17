# Depannage

Ce guide liste les problemes frequents et les solutions simples.

## EADDRINUSE sur le port 3000

Le backend ne peut pas demarrer car le port est deja utilise.

Solutions :

- Arreter l'ancien processus avec `scripts\windows\stop-sallon-connect.bat`.
- Fermer le terminal qui lance deja le backend.
- Changer `PORT` dans `.env`, puis ajuster l'URL API du frontend.

## Port 3001 deja utilise

Le frontend Next.js ne peut pas demarrer.

Solutions :

- Fermer l'ancien terminal frontend.
- Arreter le hub avec `scripts\windows\stop-sallon-connect.bat`.
- Relancer `scripts\windows\start-sallon-connect.bat`.

## Le frontend ne s'ouvre pas

Solutions :

- Verifier http://localhost:3001.
- Lancer `scripts\windows\status-sallon-connect.bat`.
- Relancer le frontend avec `npm run dev:frontend`.

## Backend indisponible

Solutions :

- Verifier http://localhost:3000/api/health.
- Lancer `npm run dev:backend`.
- Consulter les logs locaux sans les publier.

## `npm run health` echoue

Si le backend n'est pas actif, c'est attendu.

Solutions :

- Demarrer le backend.
- Relancer `npm run health`.
- Verifier que le port backend est correct.

## PowerShell bloque un script

Solution :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\status-sallon-connect.ps1
```

N'utilisez cette option que pour les scripts du projet que vous avez verifies.

## Node version trop ancienne

Solution :

- Installer Node.js 22.13 ou plus recent.
- Fermer et rouvrir le terminal.
- Verifier `node --version`.

## La PWA ne s'installe pas

Solutions :

- Utiliser Chrome ou Edge.
- Ouvrir http://localhost:3001.
- Verifier que le frontend est lance.
- Essayer depuis le menu du navigateur.

## Service worker avec cache ancien

Solutions :

- Fermer tous les onglets Sallon-ConnecT.
- Vider le cache du site dans le navigateur.
- Relancer le frontend.

## SmartThings token absent

SmartThings est optionnel. Si vous ne l'utilisez pas, laissez-le desactive.

Pour l'activer :

- Renseigner `SMARTTHINGS_TOKEN` dans `.env`.
- Garder les options dangereuses desactivees par defaut.
- Redemarrer le backend.

## ADB disabled

ADB est desactive par defaut.

Solutions :

- Verifier `ADB_ENABLED`.
- Verifier que l'outil ADB est installe.
- Garder ADB en lecture seule.

## DLNA ne trouve rien

Solutions :

- Verifier que les appareils sont sur le meme reseau local.
- Verifier `DLNA_ENABLED`.
- Redemarrer le backend.

## Backup refuse

Causes possibles :

- Sauvegarde desactivee.
- Chemin interdit.
- Tentative d'inclure un secret.

Solution : creer une sauvegarde standard depuis la section Sauvegarde.

## Restore refuse sans dry-run

C'est normal. Lancez un dry-run avant toute restauration, puis confirmez explicitement.

## Git preflight echoue

Solutions :

- Lire le rapport dans `logs/`.
- Retirer de l'index les fichiers interdits.
- Ne jamais ajouter `.env`, runtime, logs, backups ou dependances.
- Relancer `powershell -ExecutionPolicy Bypass -File scripts\release\preflight-github.ps1`.
