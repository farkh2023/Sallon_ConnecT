# Phase 16 - Packaging Windows local

## Objectif

La Phase 16 ajoute un packaging Windows simple pour lancer Sallon-ConnecT en local par double-clic, avec scripts de diagnostic, statut, build frontend, raccourci Bureau et archive ZIP portable.

Le backend Express, l'ancien frontend HTML et le frontend Next.js existants ne sont pas reecrits.

## Architecture

Scripts disponibles dans `scripts/windows/`:

- `install-deps.ps1`: installe les dependances racine et frontend.
- `start-sallon-connect.ps1`: lance backend `:3000` et frontend Next `:3001`.
- `stop-sallon-connect.ps1`: arrete les processus en ecoute sur `3000` et `3001`.
- `status-sallon-connect.ps1`: affiche l'etat des ports, endpoints et dossiers locaux.
- `build-frontend.ps1`: execute `npm run lint` puis `npm run build` dans `frontend/`.
- `package-portable.ps1`: cree une archive ZIP portable dans `dist/`.
- `create-desktop-shortcut.ps1`: cree un raccourci Bureau `Sallon-ConnecT`.
- `open-dashboard.ps1`: ouvre `http://localhost:3001` si disponible, sinon `http://localhost:3000`.
- `diagnose.ps1`: genere un diagnostic console et `logs/diagnostic-YYYYMMDD-HHMM.txt`.

Wrappers `.bat`:

- `install-deps.bat`
- `start-sallon-connect.bat`
- `stop-sallon-connect.bat`
- `status-sallon-connect.bat`
- `open-dashboard.bat`

## Securite

Les scripts ne lisent pas le contenu complet de `.env` et n'affichent pas de secrets. Le diagnostic indique seulement si `.env` existe et s'il est vide.

Le packaging exclut:

- `.git/`
- `.env`, `.env.local`, `frontend/.env.local`
- `node_modules/`, `frontend/node_modules/`
- `.next/`, `frontend/.next/`
- `runtime/*.json`
- `logs/`
- `dist/*.zip`
- fichiers temporaires, `*.pem`, `*.key`, noms contenant token/secret/credential/private

## Logs

Les logs locaux sont ecrits dans `logs/`.

Seul `logs/.gitkeep` est conserve dans Git. Les fichiers `logs/*.log` et `logs/*.txt` sont ignores.

## Package Portable

Commande:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\package-portable.ps1
```

Sortie:

```text
dist/Sallon-ConnecT-Portable-YYYYMMDD-HHMM.zip
```

L'archive contient `runtime/.gitkeep` et `logs/.gitkeep`, mais pas les historiques/audits runtime ni les logs locaux.

## Raccourci Bureau

Commande:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\create-desktop-shortcut.ps1
```

Le raccourci lance `scripts/windows/start-sallon-connect.bat` sans privileges administrateur.

## Limites Actuelles

- Pas d'installateur MSI.
- Pas de service Windows installe automatiquement.
- Le lancement reste base sur Node.js et npm locaux.
- Le plein fonctionnement depend de dependances deja installees ou de `install-deps.ps1`.

## Prochaines Etapes

- Ajouter une verification signee de l'archive portable si une distribution externe est prevue.
- Ajouter un script optionnel de service Windows uniquement avec confirmation explicite.
- Ajouter un test CI qui inspecte le contenu du ZIP avant publication.
