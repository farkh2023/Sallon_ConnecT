# Guide utilisateur Sallon-ConnecT

Ce guide s'adresse a l'utilisateur final de la release portable Windows `v0.4.0`.

Sallon-ConnecT est un hub local pour piloter, observer et diagnostiquer les services d'un salon connecte depuis une interface web Next.js et une API Express. L'application fonctionne en local sur la machine Windows : pas de cloud obligatoire, pas de telemetrie, pas de secret publie.

## Fonctionnalites principales

| Zone | Ce que vous pouvez faire |
|---|---|
| Dashboard | Voir l'etat general du hub, les appareils, les medias, les scenarios et les raccourcis utiles. |
| Observabilite | Suivre le backend, le runtime, les logs masques, la securite, les tests et les snapshots. |
| Notifications | Consulter les notifications locales, les filtrer, marquer comme lues et verifier leur source. |
| Diagnostics | Controler backend, SSE, scheduler, backup, notifications, stockage et securite local-only. |
| SSE local | Recevoir les evenements locaux en temps reel depuis `localhost`. |
| Centre d'aide | Acceder a l'aide integree, aux commandes utiles, a la FAQ et aux exercices pratiques. |
| Sauvegarde | Creer des sauvegardes locales avec manifest, verifier et restaurer avec dry-run. |

## Installation Windows

Prerequis :

- Windows 10 ou Windows 11 ;
- Node.js `>=22.13.0` recommande ;
- npm installe avec Node.js ;
- PowerShell disponible.

Installation depuis le ZIP portable :

1. Telechargez le ZIP `Sallon-ConnecT-Portable-YYYYMMDD-HHMM.zip`.
2. Extrayez-le dans un dossier local, par exemple `C:\Sallon-ConnecT`.
3. Ouvrez PowerShell dans ce dossier.
4. Lancez :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\release\start-release.ps1
```

Au premier lancement, le script installe les dependances npm si elles sont absentes, genere le build frontend si necessaire, puis lance :

- backend : `http://localhost:3000` ;
- frontend : `http://localhost:3001`.

## Lancement rapide

Depuis le dossier extrait :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\release\start-release.ps1
```

Pour un lancement standard deja configure, vous pouvez aussi utiliser :

```powershell
scripts\windows\start-sallon-connect.bat
```

Arret :

```powershell
scripts\windows\stop-sallon-connect.bat
```

Statut :

```powershell
scripts\windows\status-sallon-connect.bat
```

## Structure des dossiers

| Dossier | Role | Sensibilite |
|---|---|---|
| `frontend/` | Interface Next.js | Code applicatif |
| `server/` | Routes API et services locaux | Code applicatif |
| `docs/` | Documentation utilisateur et technique | Public |
| `scripts/windows/` | Scripts installation, lancement, diagnostic, packaging | Public |
| `runtime/` | Etat local genere par l'application | Prive, non publie |
| `logs/` | Logs locaux et rapports | Prive, non publie |
| `backups/` | Sauvegardes locales | Prive, non publie |
| `dist/` | Artefacts release locaux | A verifier avant partage |

Les fichiers `.env`, `.env.local`, `node_modules`, `.next`, logs bruts, fichiers runtime JSON et backups prives ne doivent pas etre publies.

## Observabilite

L'observabilite regroupe l'etat du backend, du frontend attendu, du scheduler, des integrations, des notifications, des tests, des logs masques et de la securite.

Endpoints utiles :

```text
http://localhost:3000/api/observability/overview
http://localhost:3000/api/observability/snapshots
http://localhost:3000/api/observability/snapshots/timeline
```

Les exports d'observabilite restent locaux. Les contenus sensibles sont masques ou resumes.

## Notifications

Les notifications sont locales. Elles signalent par exemple :

- demarrage du serveur ;
- etat scheduler ;
- changement de statut d'observabilite ;
- evenements systeme locaux ;
- alertes de securite non sensibles.

Endpoints utiles :

```text
http://localhost:3000/api/notifications
http://localhost:3000/api/notifications/stats
```

Aucune notification cloud ou push externe n'est requise.

## Diagnostics

Le tableau de diagnostic confirme les points critiques :

- backend disponible ;
- SSE actif ;
- scheduler lisible ;
- backup disponible ;
- notifications accessibles ;
- stockage local present ;
- securite `localOnly=true`.

Endpoint :

```text
http://localhost:3000/api/diagnostics/overview
```

Export diagnostic JSON :

1. Ouvrez le panneau Observabilite ou Diagnostic.
2. Utilisez le bouton d'export JSON si disponible.
3. Conservez le fichier localement.
4. Ne publiez pas un export sans relecture si votre environnement contient des chemins personnels.

## SSE local

Le flux SSE local est disponible ici :

```text
http://localhost:3000/api/events/stream
```

Il accepte uniquement les origines locales attendues :

- `http://localhost:3000` ;
- `http://localhost:3001`.

Un appel depuis une autre origine recoit `403` avec `localOnly=true`.

## Mode offline et local-only

Sallon-ConnecT est concu pour fonctionner sans cloud obligatoire. Les connecteurs externes restent optionnels et opt-in.

Le mode offline couvre :

- interface PWA et page `/offline` ;
- historique local cote navigateur ;
- diagnostics et observabilite locaux si le backend est actif ;
- absence d'upload automatique.

Sans reseau Internet, le premier lancement depuis ZIP peut echouer si les dependances npm ne sont pas encore installees. Dans ce cas, connectez la machine une fois, relancez `start-release.ps1`, puis utilisez l'application localement.

## Captures et UX

Les captures automatiques n'ont pas ete produites dans cette session. Les placeholders a remplacer avant publication visuelle sont documentes ici :

- [Placeholders captures](assets/screenshots/README.md)

Captures recommandees :

- dashboard principal ;
- centre de notifications ;
- tableau diagnostics ;
- observabilite ;
- centre d'aide.

## Troubleshooting

| Probleme | Cause probable | Action |
|---|---|---|
| `Node.js est requis` | Node absent du PATH | Installer Node.js puis relancer PowerShell. |
| Warning Node trop ancien | Version inferieure a `22.13.0` | Installer une version Node plus recente. |
| Port `3000` occupe | Backend deja lance ou autre service | `scripts\windows\status-sallon-connect.bat`, puis `stop-sallon-connect.bat`. |
| Port occupe par autre chose | Service non Sallon-ConnecT | Fermer le processus indique par le PID ou changer de service. |
| Frontend indisponible | Build absent ou serveur Next arrete | Relancer `start-release.ps1`. |
| Dependances incompletes | Installation npm interrompue | Relancer `start-release.ps1`; le script repare les dependances incompletes. |
| `.env` absent | Configuration optionnelle non creee | Copier `.env.example` vers `.env` si vous activez des connecteurs. |
| SSE en erreur | Backend indisponible ou origine non locale | Verifier `http://localhost:3000/api/health` et utiliser `localhost`. |

## FAQ utilisateur

**Est-ce que Sallon-ConnecT envoie mes donnees dans le cloud ?**  
Non. La release locale stable fonctionne sans cloud obligatoire et sans telemetrie.

**Dois-je creer un fichier `.env` ?**  
Non pour tester le hub. Oui seulement si vous configurez des connecteurs optionnels.

**Pourquoi Node.js est-il requis ?**  
La release portable contient les sources et scripts, pas un binaire autonome.

**Puis-je utiliser l'application hors ligne ?**  
Oui apres installation des dependances et build initial. Le premier lancement peut necessiter Internet pour npm.

**Que faire si le navigateur ne s'ouvre pas ?**  
Ouvrez manuellement `http://localhost:3001`.

**Les exports JSON sont-ils surs ?**  
Ils sont locaux et limites aux diagnostics non sensibles. Relisez avant tout partage externe.

## Desinstallation propre

1. Arretez les processus :

```powershell
scripts\windows\stop-sallon-connect.bat
```

2. Supprimez les raccourcis Bureau et Menu Demarrer si vous les avez crees.
3. Supprimez le dossier extrait si vous ne souhaitez plus utiliser l'application.
4. Supprimez optionnellement `runtime/`, `logs/`, `backups/` et `node_modules/` si vous voulez retirer toutes les donnees locales.

Ne supprimez `backups/` qu'apres avoir confirme que vous n'en avez plus besoin.
