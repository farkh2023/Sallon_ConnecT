# Mise a jour securisee — Sallon-ConnecT v0.4.0

Guide complet du systeme de mise a jour locale depuis GitHub Releases.

## Presentation

Le systeme de mise a jour est **manuel par defaut**. Aucune mise a jour ne se produit sans action explicite de l'utilisateur. Chaque etape (verifier, telecharger, appliquer) est une commande distincte.

**GitHub officiel uniquement. SHA256 obligatoire avant apply. Donnees utilisateur preservees.**

## Modele de menace

| Menace | Protection |
|--------|-----------|
| Mise a jour depuis une source non autorisee | URL validee : `https://github.com/farkh2023/` uniquement |
| Fichier corrompu ou falsifie | SHA256 verifie avant apply — refus si mismatch |
| Extension dangereuse | Seuls .zip, .txt, .json acceptes |
| Perte de donnees utilisateur | logs/, runtime/, backups/, .env, data/ jamais ecrases |
| Auto-update non desire | Aucune tache planifiee, aucun polling reseau |
| Secret dans rapport | Rapports sans chemins absolus, tokens, ni credentials |
| Rollback impossible | Backup systematique avant apply dans runtime/update-backups/ |

## Prerequis

- Connexion internet pour `check-update.ps1` et `download-update.ps1`
- Droits utilisateur normaux (pas d'admin requis)
- PowerShell 5.1 (inclus Windows 10+)
- Espace disque suffisant (backup + ZIP nouveau + extraction)

## Procedure complete

### Etape 1 — Verifier la disponibilite

```powershell
scripts\windows\update\check-update.ps1
```

Affiche :
- Version locale
- Version distante (depuis GitHub API)
- Changelog court
- URL release GitHub
- Assets disponibles (nom + taille)

```powershell
# Format JSON
scripts\windows\update\check-update.ps1 -Json
```

Aucun telechargement a cette etape.

### Etape 2 — Telecharger

```powershell
scripts\windows\update\download-update.ps1
```

Actions :
1. Recupere la liste des assets depuis GitHub API
2. Valide chaque URL (prefix `https://github.com/farkh2023/`)
3. Valide chaque extension (.zip, .txt, .json)
4. Telecharge dans `runtime/updates/<version>/`
5. Calcule le SHA256 du ZIP
6. Verifie le SHA256 contre le fichier `*-sha256.txt` ou `*-release.json`
7. Ecrit `verification.json` avec le resultat

```powershell
# Forcer le re-telechargement
scripts\windows\update\download-update.ps1 -Force
```

### Etape 3 — Verifier le SHA256

Le SHA256 est verifie automatiquement pendant le telechargement. Le fichier `verification.json` contient :

```json
{
  "timestamp": "2026-05-22T10:30:00",
  "version": "0.4.1",
  "zipFile": "Sallon-ConnecT-Portable-*.zip",
  "zipSizeBytes": 750000,
  "sha256Local": "abc123...",
  "sha256Expected": "abc123...",
  "verified": true
}
```

Si `verified: false`, le `apply-update.ps1` est refuse automatiquement.

### Etape 4 — Appliquer

```powershell
scripts\windows\update\apply-update.ps1
```

Sequence d'actions :
1. Verifie `verification.json` (refuse si SHA256 invalide)
2. Demande confirmation explicite ("oui" requis)
3. Arrete le tray et le service si actifs
4. Cree un backup dans `runtime/update-backups/<timestamp>/`
5. Extrait le ZIP dans `runtime/updates/<version>/extracted/`
6. Verifie la structure minimale (server.js, package.json)
7. Copie les nouveaux fichiers (preserve logs/, runtime/, backups/, .env, data/)
8. Ecrit `apply-report.json`

```powershell
# Sans confirmation interactive (scripts automatises)
scripts\windows\update\apply-update.ps1 -Confirm

# Avec redemarrage automatique
scripts\windows\update\apply-update.ps1 -Confirm -Restart
```

### Etape 5 — Relancer apres apply

Si `package.json` a change, reinstaller les dependances :

```powershell
npm install
cd frontend && npm install && npm run build && cd ..
```

Puis relancer :

```powershell
scripts\windows\start-sallon-connect.ps1
```

## Rollback

### Lister les backups

```powershell
scripts\windows\update\rollback-update.ps1 -List
```

### Restaurer la version precedente

```powershell
scripts\windows\update\rollback-update.ps1
```

Actions :
1. Liste les backups dans `runtime/update-backups/`
2. Selectionne le plus recent
3. Demande confirmation
4. Arrete service/tray si actifs
5. Restaure les fichiers du backup
6. Verifie VERSION

```powershell
# Sans confirmation
scripts\windows\update\rollback-update.ps1 -Confirm

# Avec redemarrage
scripts\windows\update\rollback-update.ps1 -Confirm -Restart
```

**Note** : le rollback restaure uniquement les fichiers applicatifs (server.js, server/, scripts/, package.json, VERSION). Les donnees utilisateur (logs, .env, data) ne sont pas rollbackees.

## Statut

```powershell
# Affichage complet
scripts\windows\update\update-status.ps1

# Format JSON
scripts\windows\update\update-status.ps1 -Json
```

Retourne : version locale, telechargements disponibles (SHA256 status, applique ou non), backups disponibles.

## Integration tray

Menu clic-droit → **Verifier mise a jour...** : ouvre `check-update.ps1` dans un terminal visible. Aucun appel reseau automatique.

## Conservation des donnees utilisateur

Lors de l'apply, les chemins suivants ne sont **jamais ecrases** :

| Chemin | Contenu |
|--------|---------|
| `logs/` | Journaux applicatifs |
| `runtime/` | Etat runtime, updates, backups apply |
| `backups/` | Sauvegardes utilisateur (Phase 21) |
| `.env` | Configuration locale backend |
| `data/` | Donnees applicatives (profils, planifications) |
| `node_modules/` | Dependances npm |
| `frontend/node_modules/` | Dependances frontend |
| `frontend/.next/` | Build frontend |
| `frontend/.env.local` | Configuration frontend locale |

## Depannage

### "SHA256 invalide — apply refuse"

Le fichier ZIP est corrompu ou ne correspond pas au hash attendu. Retelecharger :

```powershell
scripts\windows\update\download-update.ps1 -Force
```

### "Erreur API GitHub"

La connexion internet est absente ou GitHub est inaccessible. Verifier le reseau et relancer `check-update.ps1`.

### "Aucune mise a jour dans runtime\updates\"

`download-update.ps1` n'a pas ete execute, ou le dossier `runtime/updates/` est absent. Lancer le telechargement d'abord.

### "Aucun backup disponible"

`apply-update.ps1` n'a pas encore ete execute sur cette machine, ou les backups ont ete supprimes manuellement. Pas de rollback possible. Reinstaller depuis le ZIP portable.

### Structure ZIP invalide

Le ZIP telecharge ne contient pas `server.js` ou `package.json` a la racine. Retelecharger depuis la release GitHub officielle.

## Limites connues

| Limite | Detail |
|--------|--------|
| Connexion requise | check + download necessitent internet |
| npm install non automatique | A executer manuellement si package.json change |
| Rollback code seulement | Donnees utilisateur non rollbackees |
| Un backup actif | Seul le backup le plus recent est utilise par rollback |
| Pas de delta | Telechargement du ZIP complet (pas de diff) |
| GitHub API rate limit | 60 requetes/heure sans token (largement suffisant) |
