# Manuel d'utilisation complet — Sallon-ConnecT

> Version v0.1.0 — Local-first, Windows, réseau local

---

## Table des matières

1. [Présentation](#1-présentation)
2. [Prérequis](#2-prérequis)
3. [Installation](#3-installation)
   - 3.1 [Installation guidée (recommandée)](#31-installation-guidée-recommandée)
   - 3.2 [Installation manuelle rapide](#32-installation-manuelle-rapide)
   - 3.3 [Premier lancement](#33-premier-lancement)
4. [Démarrage et arrêt](#4-démarrage-et-arrêt)
5. [Ouvrir le dashboard](#5-ouvrir-le-dashboard)
6. [Sections du dashboard](#6-sections-du-dashboard)
   - 6.1 [Hub](#61-hub)
   - 6.2 [Appareils](#62-appareils)
   - 6.3 [Agents](#63-agents)
   - 6.4 [Médias](#64-médias)
   - 6.5 [Scénarios](#65-scénarios)
   - 6.6 [Notifications](#66-notifications)
   - 6.7 [Observabilité](#67-observabilité)
   - 6.8 [Tâches](#68-tâches)
   - 6.9 [Profils](#69-profils)
   - 6.10 [Sauvegarde](#610-sauvegarde)
7. [Mode TV](#7-mode-tv)
8. [Assistant vocal](#8-assistant-vocal)
9. [Installation PWA](#9-installation-pwa)
10. [Profils et permissions](#10-profils-et-permissions)
11. [Sauvegarde et restauration](#11-sauvegarde-et-restauration)
12. [Raccourcis clavier](#12-raccourcis-clavier)
13. [Réparation et désinstallation](#13-réparation-et-désinstallation)
14. [Dépannage](#14-dépannage)
15. [FAQ](#15-faq)
16. [Sécurité](#16-sécurité)

---

## 1. Présentation

Sallon-ConnecT est un tableau de bord local pour suivre et piloter les fonctions du salon connecté depuis un navigateur. Il centralise les appareils, les médias, les scénarios, les notifications, les tâches, les profils et les sauvegardes.

La plateforme fonctionne sur votre machine et votre réseau local. Elle ne nécessite pas de cloud pour afficher le dashboard.

**Ce que vous pouvez faire :**

- Ouvrir un dashboard local depuis un PC, une tablette ou une TV
- Naviguer entre Hub, Appareils, Agents, Médias, Scénarios, Notifications, Observabilité, Tâches, Profils et Sauvegarde
- Installer l'interface comme application PWA
- Utiliser le Mode TV pour un affichage plein écran
- Créer des sauvegardes locales contrôlées
- Consulter les notifications locales et les résultats de tâches
- Vérifier l'état du backend et du frontend

**Adresses locales :**

| Service | Adresse |
|---|---|
| Backend Express | http://localhost:3000 |
| Frontend Next.js | http://localhost:3001 |

---

## 2. Prérequis

- Windows 10 ou 11
- Node.js 22.13 ou plus récent
- npm (installé avec Node.js)
- PowerShell disponible
- Ports 3000 et 3001 libres

Vérifier Node.js et npm :

```powershell
node --version
npm --version
```

---

## 3. Installation

### 3.1 Installation guidée (recommandée)

Depuis la racine du projet :

```powershell
scripts\windows\install\install-sallon-connect.bat
```

Le script effectue automatiquement :

- Vérification des prérequis
- Création de `runtime/`, `logs/`, `backups/` et `dist/` si nécessaire
- Création des `.gitkeep` manquants
- Création de `.env` depuis `.env.example` uniquement si absent
- Création de `frontend/.env.local` depuis `frontend/.env.example` si absent
- Installation des dépendances (`npm install` racine et frontend)
- Build du frontend (`npm run build:frontend`)
- Création des raccourcis Bureau et Menu Démarrer
- Lancement de `npm run health` si le backend est actif

**Options disponibles :**

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\install\install-sallon-connect.ps1 -SkipInstallDeps
powershell -ExecutionPolicy Bypass -File scripts\windows\install\install-sallon-connect.ps1 -SkipBuild
powershell -ExecutionPolicy Bypass -File scripts\windows\install\install-sallon-connect.ps1 -NoShortcut
```

Un rapport d'installation est créé dans `logs/install-YYYYMMDD-HHMM.txt`.

Vérifier les prérequis séparément :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\install\check-prerequisites.ps1
```

### 3.2 Installation manuelle rapide

Installer les dépendances :

```powershell
scripts\windows\install-deps.bat
```

Créer un raccourci Bureau :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\create-desktop-shortcut.ps1
```

Créer les raccourcis Menu Démarrer :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\install\create-start-menu-shortcut.ps1
```

### 3.3 Premier lancement

L'assistant de première configuration pose des questions simples :

```powershell
scripts\windows\install\first-run-wizard.bat
```

Il crée les fichiers d'environnement depuis les exemples et configure les raccourcis. Il ne demande pas de token SmartThings dans la console — si vous activez SmartThings, modifiez `.env` manuellement et ne partagez jamais son contenu.

---

## 4. Démarrage et arrêt

**Démarrer Sallon-ConnecT :**

```powershell
scripts\windows\start-sallon-connect.bat
```

Le backend écoute sur http://localhost:3000 et le frontend sur http://localhost:3001.

**Vérifier le statut :**

```powershell
scripts\windows\status-sallon-connect.bat
```

**Arrêter proprement :**

```powershell
scripts\windows\stop-sallon-connect.bat
```

Utilisez ce script avant de fermer Windows ou avant de changer de configuration.

---

## 5. Ouvrir le dashboard

```powershell
scripts\windows\open-dashboard.bat
```

Si le navigateur ne s'ouvre pas, ouvrez manuellement http://localhost:3001.

Vous pouvez aussi utiliser le raccourci Bureau ou le Menu Démarrer créé lors de l'installation.

---

## 6. Sections du dashboard

La barre du haut permet de naviguer directement entre les sections.

### 6.1 Hub

Le Hub présente l'état général du serveur local, la phase courante et le nombre d'appareils connus. Le bouton de scan rafraîchit les statuts disponibles.

- **Réel :** health check backend et appels API locaux

### 6.2 Appareils

Affiche les appareils déclarés dans les données locales et leur état connu.

- **Réel :** statuts locaux disponibles
- **Limité :** les appareils non configurés restent en état neutre

### 6.3 Agents

Présente les rôles logiques du hub et aide à comprendre comment les fonctions sont organisées.

- **Simulé :** les agents ne lancent pas d'actions sensibles automatiquement

### 6.4 Médias

Regroupe ADB, DLNA, SmartThings et streaming assisté.

- **Réel si activé :** diagnostics et statuts locaux
- **Bloqué par sécurité :** écriture ADB, scène SmartThings automatique, commande TV automatique, streaming automatique

### 6.5 Scénarios

Propose des routines comme cinéma, travail, famille ou diagnostic.

- **Réel :** prévisualisation et logique locale
- **Bloqué par sécurité :** exécution sensible sans confirmation, action non allowlistée, action contournant le backend

### 6.6 Notifications

Affiche les événements locaux du hub : informations, succès, warnings, erreurs et alertes sécurité.

- **Réel :** stockage local et filtrage
- **Aucune notification cloud obligatoire**

### 6.7 Observabilité

Affiche l'état du backend, du runtime, de la sécurité, des tests et des snapshots.

- **Réel :** indicateurs locaux et exports non sensibles
- **Bloqué par sécurité :** logs bruts, chemins complets, secrets et IP complètes

### 6.8 Tâches

Les tâches planifiées sont locales et limitées à des actions sûres.

- **Réel :** exécution manuelle d'actions allowlistées
- **Bloqué par sécurité :** commandes TV, scènes SmartThings, streaming automatique, restauration backup automatique

### 6.9 Profils

Les profils adaptent l'affichage et les permissions : Principal, Famille, Invité, TV, Diagnostic.

Un profil ne contourne jamais les protections backend.

### 6.10 Sauvegarde

Permet de créer, vérifier et restaurer une sauvegarde locale.

- **Réel :** ZIP local avec manifest
- **Bloqué par sécurité :** restauration sans dry-run, restauration sans confirmation, inclusion de secrets

---

## 7. Mode TV

Le Mode TV adapte le dashboard à un affichage plein écran, par exemple sur une télévision ou un grand moniteur.

**Activer le Mode TV :**

Dans la barre du haut, utilisez le bouton `Mode TV`. Le dashboard agrandit les zones importantes et facilite la lecture à distance.

**Activer le plein écran :**

Utilisez le bouton plein écran dans la barre du haut, ou le raccourci clavier `F`.

**Raccourcis clavier :**

| Touche | Action |
|---|---|
| `T` | Activer ou désactiver le Mode TV |
| `F` | Activer ou quitter le plein écran |
| `R` | Actualiser |
| `N` | Aller aux notifications |
| `S` | Aller aux tâches |
| `H` | Aller à l'observabilité |
| `Échap` | Quitter un panneau actif ou le plein écran |

**Comportement de sécurité :**

- Aucun raccourci ne lance une commande sensible
- Aucune scène SmartThings n'est exécutée automatiquement
- Aucune commande TV n'est envoyée automatiquement
- Aucun streaming ne démarre automatiquement
- Les confirmations backend restent obligatoires

**Conseils d'utilisation :**

- Démarrez d'abord le backend et le frontend
- Ouvrez http://localhost:3001 sur l'écran cible
- Utilisez le profil TV pour une interface plus restrictive

---

## 8. Assistant vocal

L'assistant vocal permet de piloter des commandes simples du dashboard. Il reste local au navigateur et ne lance aucune action sensible automatiquement.

**Activer l'assistant :**

1. Démarrez le backend et le frontend
2. Ouvrez http://localhost:3001
3. Cliquez sur `Assistant vocal` dans la barre du haut
4. Cliquez sur `Micro` pour démarrer l'écoute

L'écoute ne démarre jamais automatiquement — elle doit être déclenchée par un clic utilisateur.

**Navigateurs compatibles :**

La reconnaissance vocale utilise les APIs navigateur disponibles localement (Web Speech API). Si elle n'est pas disponible, un champ texte de secours s'affiche.

**Commandes disponibles :**

Navigation :
- `ouvre le hub`
- `ouvre les appareils`
- `ouvre les agents`
- `ouvre les médias`
- `ouvre les scénarios`
- `ouvre les notifications`
- `ouvre l'observabilité`
- `ouvre les tâches`
- `ouvre les profils`
- `ouvre la sauvegarde`

Actions sûres :
- `actualise`
- `scanne le statut`
- `affiche les notifications`
- `affiche les tâches`
- `affiche l'observabilité`
- `active le mode TV`
- `désactive le mode TV`
- `plein écran`
- `quitte le plein écran`
- `aide vocale`
- `statut du système`

**Commandes refusées (bloquées) :**

- Allumer ou éteindre la TV
- Exécuter une scène SmartThings
- Lancer un film ou une vidéo
- Lancer le streaming
- Restaurer une sauvegarde
- Supprimer un audit
- Vider les notifications
- Changer de profil

**Fallback texte :**

Si le micro n'est pas disponible, tapez la commande dans le champ texte du panneau vocal. Les mêmes règles de sécurité s'appliquent.

**Dépannage micro :**

- Vérifiez que le navigateur autorise le micro
- Vérifiez que le micro fonctionne dans Windows
- Essayez Chrome ou Edge
- Utilisez le fallback texte si le navigateur ne supporte pas la reconnaissance vocale
- Fermez puis rouvrez le panneau vocal si l'écoute reste bloquée

---

## 9. Installation PWA

Sallon-ConnecT peut être installé comme application web progressive depuis un navigateur compatible.

**Installer depuis Chrome ou Edge :**

1. Démarrez Sallon-ConnecT
2. Ouvrez http://localhost:3001
3. Dans la barre d'adresse, cherchez l'icône d'installation
4. Cliquez sur `Installer`
5. Confirmez l'installation

Selon le navigateur, l'option peut aussi se trouver dans le menu principal sous `Installer cette application`.

**Fonctionnement offline limité :**

La PWA peut afficher une page offline et certains éléments cachés. Les fonctions qui interrogent l'API locale ont besoin du backend actif.

**Limites importantes :**

- Les API locales nécessitent le backend actif sur http://localhost:3000
- Les actions sensibles restent côté backend
- La PWA ne remplace pas les scripts de démarrage
- La PWA ne stocke pas de secret
- Un cache ancien peut afficher une version obsolète — videz le cache du site si nécessaire

---

## 10. Profils et permissions

Les profils adaptent l'interface et les permissions visibles.

| Profil | Usage |
|---|---|
| Principal | Administration locale du hub |
| Famille | Consultation et usages courants |
| Invité | Vue limitée et prudente |
| TV | Affichage grand écran avec interactions réduites |
| Diagnostic | Vérification technique sans actions dangereuses |

**Changer de profil :**

Utilisez le sélecteur de profil dans la barre du haut. Le changement est local et peut modifier les sections visibles.

**Exemples de restrictions par profil :**

- Profil TV : limite les panneaux sensibles
- Profil Invité : lecture seule
- Profil Diagnostic : informations techniques sans accès restauration

**Principe important :** un profil ne contourne jamais les garde-fous backend. Si le backend refuse une action, le profil ne peut pas forcer son exécution.

---

## 11. Sauvegarde et restauration

**Créer une sauvegarde :**

1. Ouvrez le dashboard
2. Allez dans `Sauvegarde`
3. Lancez une création de sauvegarde
4. Vérifiez le résultat et le nom du ZIP

Le ZIP est stocké localement dans `backups/`.

**Vérifier une sauvegarde :**

La vérification contrôle la présence du manifest et les informations de base. Elle ne doit pas afficher de secret.

**Lire le manifest :**

Le manifest décrit le contenu de la sauvegarde et contient des empreintes SHA256. Il sert à vérifier l'intégrité sans exposer les chemins complets.

**Faire un dry-run (obligatoire avant restauration) :**

Avant une restauration, lancez toujours un dry-run. Le dry-run liste ce qui serait restauré sans modifier les fichiers.

**Restaurer avec confirmation :**

La restauration demande une confirmation explicite. Sans dry-run valide et sans code de confirmation, elle est refusée.

**Rollback automatique :**

Avant restauration, Sallon-ConnecT crée un rollback local quand l'option est activée, permettant de revenir en arrière si la restauration échoue.

**Ce qui n'est jamais sauvegardé :**

- `.env` et tokens et secrets
- `node_modules/` et `frontend/node_modules/`
- Logs bruts
- ZIP de sauvegarde existants
- Runtime sensible
- `.git/` et `.next/`
- Clés et certificats

**Bonnes pratiques :**

- Gardez les sauvegardes hors Git
- Ne partagez jamais un ZIP sans vérifier son contenu
- Lancez le preflight avant toute publication GitHub

---

## 12. Raccourcis clavier

| Touche | Action |
|---|---|
| `T` | Activer / désactiver le Mode TV |
| `F` | Plein écran / quitter le plein écran |
| `R` | Actualiser |
| `N` | Aller aux notifications |
| `S` | Aller aux tâches |
| `H` | Aller à l'observabilité |
| `Échap` | Quitter un panneau actif ou le plein écran |

Aucun raccourci ne lance une commande sensible.

---

## 13. Réparation et désinstallation

### Réparation

Utilisez la réparation si un dossier local, un `.gitkeep`, un build ou un raccourci manque :

```powershell
scripts\windows\install\repair-sallon-connect.bat
```

Mode léger (sans build ni installation des dépendances) :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\install\repair-sallon-connect.ps1 -SkipBuild -SkipInstallDeps -NoShortcut
```

La réparation ne supprime pas vos données. Elle ne remplace pas `.env` ou `frontend/.env.local` s'ils existent.

### Désinstallation douce

La désinstallation douce ne supprime pas le dossier projet automatiquement :

```powershell
scripts\windows\install\uninstall-sallon-connect.bat
```

Elle demande l'arrêt local, supprime les raccourcis si présents, puis propose optionnellement de supprimer `logs/`, `backups/`, `runtime/` et `node_modules/`. Chaque suppression demande une confirmation explicite. Par défaut, les données sont conservées.

### Raccourcis uniquement

Recréer le raccourci Bureau :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\create-desktop-shortcut.ps1
```

Recréer les raccourcis Menu Démarrer :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\install\create-start-menu-shortcut.ps1
```

---

## 14. Dépannage

### EADDRINUSE sur le port 3000

Le backend ne peut pas démarrer car le port est déjà utilisé.

Solutions :
- `scripts\windows\stop-sallon-connect.bat`
- Fermer le terminal qui lance déjà le backend
- Changer `PORT` dans `.env`, puis ajuster l'URL API du frontend

### Port 3001 déjà utilisé

Le frontend Next.js ne peut pas démarrer.

Solutions :
- `scripts\windows\stop-sallon-connect.bat`
- Relancer `scripts\windows\start-sallon-connect.bat`

### Le frontend ne s'ouvre pas

Solutions :
- Vérifier http://localhost:3001
- `scripts\windows\status-sallon-connect.bat`
- Relancer avec `npm run dev:frontend`

### Backend indisponible

Solutions :
- Vérifier http://localhost:3000/api/health
- `npm run dev:backend`
- Consulter les logs locaux (sans les publier)

### `npm run health` échoue

Si le backend n'est pas actif, c'est attendu.

Solutions :
- Démarrer le backend
- Relancer `npm run health`
- Vérifier que le port backend est correct

### PowerShell bloque un script

Solution :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\status-sallon-connect.ps1
```

N'utilisez cette option que pour les scripts du projet que vous avez vérifiés.

### Node version trop ancienne

Solution :
- Installer Node.js 22.13 ou plus récent
- Fermer et rouvrir le terminal
- Vérifier `node --version`

### Installateur Windows bloqué sur les prérequis

Solutions :
- `powershell -ExecutionPolicy Bypass -File scripts\windows\install\check-prerequisites.ps1`
- Installer Node.js si Node ou npm est absent
- Fermer et rouvrir PowerShell après installation de Node.js
- Vérifier que vous pouvez écrire dans le dossier projet

### Raccourcis Windows absents

Solutions :
- `scripts\windows\install\repair-sallon-connect.bat`
- Ou recréer uniquement les raccourcis :

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\create-desktop-shortcut.ps1
powershell -ExecutionPolicy Bypass -File scripts\windows\install\create-start-menu-shortcut.ps1
```

### La PWA ne s'installe pas

Solutions :
- Utiliser Chrome ou Edge
- Ouvrir http://localhost:3001
- Vérifier que le frontend est lancé
- Essayer depuis le menu du navigateur

### Service worker avec cache ancien

Solutions :
- Fermer tous les onglets Sallon-ConnecT
- Vider le cache du site dans le navigateur
- Relancer le frontend

### SmartThings token absent

SmartThings est optionnel. Pour l'activer :
- Renseigner `SMARTTHINGS_TOKEN` dans `.env`
- Garder les options dangereuses désactivées par défaut
- Redémarrer le backend

### ADB désactivé

ADB est désactivé par défaut.

Solutions :
- Vérifier `ADB_ENABLED`
- Vérifier que l'outil ADB est installé
- Garder ADB en lecture seule

### DLNA ne trouve rien

Solutions :
- Vérifier que les appareils sont sur le même réseau local
- Vérifier `DLNA_ENABLED`
- Redémarrer le backend

### Backup refusé

Causes possibles :
- Sauvegarde désactivée
- Chemin interdit
- Tentative d'inclure un secret

Solution : créer une sauvegarde standard depuis la section Sauvegarde.

### Restore refusé sans dry-run

C'est normal. Lancez un dry-run avant toute restauration, puis confirmez explicitement.

### Git preflight échoue

Solutions :
- Lire le rapport dans `logs/`
- Retirer de l'index les fichiers interdits
- Ne jamais ajouter `.env`, runtime, logs, backups ou dépendances
- Relancer `powershell -ExecutionPolicy Bypass -File scripts\release\preflight-github.ps1`

---

## 15. FAQ

**Est-ce que Sallon-ConnecT envoie mes données au cloud ?**

Non. Le projet est local-first. Le dashboard et le backend tournent sur votre machine. Les intégrations externes comme SmartThings sont optionnelles.

**Est-ce que SmartThings est obligatoire ?**

Non. Le dashboard fonctionne sans SmartThings. Si SmartThings est désactivé, les panneaux affichent un statut limité.

**Est-ce que ADB lit mes photos ?**

Non par défaut. ADB est en lecture seule et sert au diagnostic. Aucune copie de fichiers personnels ne doit être lancée automatiquement.

**Est-ce que le streaming est automatique ?**

Non. Le streaming est assisté et protégé. Aucun scénario ou raccourci ne doit lancer un streaming automatiquement.

**Est-ce que je peux utiliser seulement le dashboard ?**

Oui. Vous pouvez consulter les statuts, notifications, profils, sauvegardes et observabilité sans activer les intégrations.

**Est-ce que le mode TV lance des commandes ?**

Non. Le Mode TV change l'affichage. Il ne lance pas de commande sensible.

**Est-ce que l'assistant vocal utilise un cloud ?**

Non. Il utilise uniquement les APIs disponibles dans le navigateur et un fallback texte. Aucune API cloud n'est appelée par Sallon-ConnecT pour l'assistant vocal.

**Est-ce que l'assistant vocal peut lancer une action sensible ?**

Non. Les commandes TV, scènes SmartThings, streaming, restauration backup, suppression d'audit, vidage notifications et changement de profil sont bloqués.

**Est-ce que l'installateur Windows crée un MSI ?**

Non. L'installateur fournit des scripts PowerShell et `.bat` locaux. Aucun MSI ni service Windows n'est créé automatiquement.

**Est-ce que l'installateur écrase mon `.env` ?**

Non. Si `.env` ou `frontend/.env.local` existe déjà, le script le conserve. Les fichiers sont créés depuis les exemples uniquement s'ils sont absents.

**Comment réparer une installation locale ?**

```powershell
scripts\windows\install\repair-sallon-connect.bat
```

La réparation recrée les dossiers et raccourcis manquants sans supprimer vos données.

**Où sont stockées les données ?**

| Dossier | Contenu |
|---|---|
| `data/` | Données versionnées |
| `runtime/` | États locaux |
| `logs/` | Logs et rapports |
| `backups/` | Sauvegardes locales |

Les dossiers locaux sensibles sont ignorés par Git.

**Qu'est-ce qui est exclu des sauvegardes ?**

Les secrets, `.env`, les dépendances, les logs bruts, les anciens ZIP de sauvegarde, `.git/`, `.next/`, les clés et certificats.

**Comment arrêter proprement ?**

```powershell
scripts\windows\stop-sallon-connect.bat
```

**Comment publier sur GitHub sans secrets ?**

```powershell
npm run check
powershell -ExecutionPolicy Bypass -File scripts\release\preflight-github.ps1
```

Vérifiez que le preflight ne signale aucun fichier interdit ni secret probable, puis commitez uniquement les fichiers attendus.

---

## 16. Sécurité

**Principes fondamentaux :**

- Ne mettez jamais de secret dans la documentation, dans une issue ou dans Git
- Le fichier `.env` réel reste local
- Les dossiers `runtime/`, `logs/`, `backups/`, `node_modules/` et `.next/` ne doivent pas être publiés

**Intégrations optionnelles :**

SmartThings, ADB, DLNA et le streaming sont optionnels. Les actions sensibles restent protégées par le backend, même si un profil ou un raccourci clavier est utilisé.

**Ce qui est toujours bloqué :**

- Exécution de scène SmartThings sans confirmation
- Commande TV automatique
- Streaming automatique
- Restauration de sauvegarde sans dry-run et confirmation
- Inclusion de secrets dans une sauvegarde ou un export

**Notifications :**

Les messages sont nettoyés pour éviter l'affichage de secrets, chemins complets, IP complètes ou identifiants sensibles.

**Assistant vocal :**

- Aucun cloud
- Aucun appel OpenAI, Google Cloud, Azure, Firebase ou service externe
- Audio non stocké
- Historique de transcription limité et en mémoire uniquement
- Actions sensibles bloquées côté frontend et toujours protégées côté backend

**Observabilité :**

L'observabilité ne doit pas exposer : logs bruts, chemins complets, secrets, IP complètes, identifiants complets, contenu de `.env`.
