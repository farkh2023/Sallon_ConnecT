# Quick Start Sallon-ConnecT

Objectif : lancer rapidement la release portable Windows `v0.4.0`.

## 1. Extraire le ZIP

1. Telechargez `Sallon-ConnecT-Portable-YYYYMMDD-HHMM.zip`.
2. Clic droit, puis `Extraire tout`.
3. Choisissez un dossier local simple, par exemple :

```text
C:\Sallon-ConnecT
```

Evitez de lancer l'application directement depuis le ZIP non extrait.

## 2. Premier demarrage

Ouvrez PowerShell dans le dossier extrait, puis lancez :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\release\start-release.ps1
```

Le premier demarrage peut prendre plusieurs minutes :

- installation des dependances racine si absentes ;
- installation des dependances frontend si absentes ;
- build Next.js si absent ;
- lancement backend et frontend.

## 3. Double-clic script

Apres le premier demarrage ou une installation deja preparee, vous pouvez double-cliquer :

```text
scripts\windows\start-sallon-connect.bat
```

Pour un ZIP portable tout juste extrait, preferez `start-release.ps1`, car il repare les dependances et le build si necessaire.

## 4. URLs locales

| Service | URL |
|---|---|
| Frontend | `http://localhost:3001` |
| Backend | `http://localhost:3000` |
| Health backend | `http://localhost:3000/api/health` |
| Diagnostics | `http://localhost:3000/api/diagnostics/overview` |
| SSE clients | `http://localhost:3000/api/events/client-count` |

## 5. Verifier le backend

Dans PowerShell :

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

Resultat attendu :

```json
{
  "status": "ok",
  "server": "Sallon-ConnecT Hub"
}
```

## 6. Verifier le frontend

Ouvrez :

```text
http://localhost:3001
```

Le dashboard doit afficher l'interface Sallon-ConnecT. Si le navigateur ne s'ouvre pas automatiquement, copiez l'URL dans votre navigateur.

## 7. Arreter et redemarrer

Arret :

```powershell
scripts\windows\stop-sallon-connect.bat
```

Statut :

```powershell
scripts\windows\status-sallon-connect.bat
```

Redemarrage :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\release\start-release.ps1
```

## Erreurs frequentes

| Message | Resolution |
|---|---|
| `Node.js est requis` | Installer Node.js, puis rouvrir PowerShell. |
| `Unsupported engine` | Installer Node `>=22.13.0`; une version plus ancienne peut fonctionner mais n'est pas recommandee. |
| `Dependances incompletes` | Relancer `start-release.ps1`; si l'erreur persiste, supprimer `node_modules/` puis relancer. |
| `Le port 3000 est occupe` | Fermer le processus indique ou lancer `scripts\windows\stop-sallon-connect.bat`. |
| `Frontend indisponible` | Relancer `start-release.ps1` pour reconstruire `.next`. |
| `SSE 403` | Utiliser `localhost:3001`; les origines externes sont bloquees. |
| Internet indisponible au premier lancement | Connecter la machine une fois pour installer npm, puis utiliser en local. |

## Mode local-only

Sallon-ConnecT n'a pas besoin de cloud pour fonctionner. Les fichiers reels `.env`, les logs, les backups, les runtime JSON et les dependances installees restent locaux et ne sont pas inclus dans le ZIP.
