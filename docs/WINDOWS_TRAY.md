# Windows Tray — Sallon-ConnecT v0.4.0

Interface zone de notification Windows pour contrôler Sallon-ConnecT sans terminal.

## Présentation

Le tray apparaît dans la zone de notification Windows (coin inférieur droit). Il affiche l'état du backend en temps réel et expose un menu clic-droit pour toutes les actions courantes.

**Facultatif** — le tray ne bloque jamais le démarrage du backend. Il peut être arrêté à tout moment.

## Prérequis

| Prérequis | Détail |
|-----------|--------|
| Windows 10 / 11 | Windows Forms natif |
| PowerShell 5.1 | Inclus dans Windows 10+ |
| Sallon-ConnecT installé | Chemin projet connu |

Aucune installation supplémentaire requise.

## Lancement

### Manuel (une fois)

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\tray\start-tray.ps1
```

Le processus tray est lancé en arrière-plan (fenêtre cachée). L'icône apparaît dans la zone de notification.

### Automatique au démarrage

1. **Via l'installateur Inno Setup** : cocher "Tray Sallon-ConnecT" pendant l'installation.

2. **Manuellement** : créer un raccourci dans le dossier Démarrage Windows :
   ```
   %APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
   ```
   Raccourci pointant vers :
   ```
   powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "C:\...\scripts\windows\tray\start-tray.ps1"
   ```

### Via le Menu Démarrer

Si l'installateur est utilisé, un raccourci **Tray Sallon-ConnecT** est présent dans le Menu Démarrer → Sallon-ConnecT.

## Gestion du tray

### Arrêter

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\tray\stop-tray.ps1
```

L'icône disparaît. Le backend continue de tourner.

### Statut du tray

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\tray\tray-status.ps1
```

Retourne : état (actif/arrêté), PID, consommation mémoire.

Format JSON :
```powershell
scripts\windows\tray\tray-status.ps1 -Json
```

## Menu clic-droit

| Option | Action |
|--------|--------|
| Etat : En ligne / Arrete / Degrade | Statut courant (non cliquable) |
| **Ouvrir Sallon-ConnecT** | Ouvre http://localhost:3001 |
| Demarrer le backend | Lance `start-service.ps1` (silencieux) |
| Arreter le backend | Lance `stop-service.ps1` (silencieux) |
| Redemarrer le backend | Lance `restart-service.ps1` (silencieux) |
| Statut detaille... | Ouvre `service-status.ps1` dans un terminal visible |
| Ouvrir les logs | Explorateur → dossier `logs/` |
| Documentation | Explorateur → dossier `docs/` |
| Quitter le tray | Ferme l'icône tray (backend non impacté) |

Double-clic gauche = Ouvrir Sallon-ConnecT.

## Icônes et états

| État backend | Icône | Tooltip |
|-------------|-------|---------|
| En ligne | i (Information, bleu) | Sallon-ConnecT - En ligne |
| Arrêté | Triangle (Warning, jaune) | Sallon-ConnecT - Arrete |
| Dégradé | X (Error, rouge) | Sallon-ConnecT - Degrade |
| Vérification | Application | Sallon-ConnecT (verification...) |

## Polling et détection de l'état

Toutes les 5 secondes :
1. `GET http://localhost:3000/api/health` — si réponse 200 → **En ligne**
2. Sinon, vérifie le service Windows (`SallonConnecT`) ou la tâche planifiée
   - Service/tâche actif mais health KO → **Dégradé**
   - Aucun service actif → **Arrêté**

## Notifications Windows locales

Le tray envoie des notifications ballon (bulle) dans la zone de notification :

| Événement | Texte | Throttle |
|-----------|-------|---------|
| Backend démarré | Backend en ligne et disponible. | 60s |
| Backend arrêté | Backend arrete. | 60s |
| Backend dégradé | Backend degrade - health check echec. | 60s |
| Démarrage manuel | Demarrage du backend... | 60s |
| Arrêt manuel | Arret du backend... | 60s |

**Aucune notification cloud.** Toutes les notifications sont locales.

## Compatibilité service Windows

Le tray fonctionne quel que soit le mode de lancement du backend :

| Mode service | Contrôle tray |
|-------------|--------------|
| NSSM (service système) | Appelle `start/stop/restart-service.ps1` |
| Task Scheduler | Idem |
| Portable (manuel) | Idem — les scripts détectent le mode automatiquement |

## Sécurité

- Polling sur `localhost:3000` uniquement
- Aucune donnée envoyée vers l'extérieur
- Aucun secret stocké ou affiché
- Pas d'élévation admin
- Le tray ne lit pas `.env`
- PID file dans `%TEMP%\SallonConnecT-Tray.pid` — local, non sensible

## Dépannage

### L'icône n'apparaît pas

```powershell
scripts\windows\tray\tray-status.ps1
```

Si arrêté : relancer `start-tray.ps1`. Si déjà actif : vérifier la zone de notification Windows (flèche ^ pour afficher les icônes cachées).

### Le tray ne répond plus

```powershell
scripts\windows\tray\stop-tray.ps1
scripts\windows\tray\start-tray.ps1
```

### Le statut reste "Arrêté" même si le backend tourne

Vérifier que le backend répond bien :
```powershell
Invoke-WebRequest http://localhost:3000/api/health -UseBasicParsing
```

Si le backend utilise un port différent, le tray (qui poll port 3000) ne le détecte pas.

### Mémoire du tray

Le tray consomme typiquement 30–50 MB (processus PowerShell + Windows Forms). C'est normal.

## Fichier PID

Le tray écrit son PID dans `%TEMP%\SallonConnecT-Tray.pid`. Ce fichier est supprimé à l'arrêt propre du tray. Si le processus est tué sans passer par `stop-tray.ps1`, le fichier reste — il sera nettoyé au prochain démarrage du tray.

## Limites connues

| Limite | Détail |
|--------|--------|
| Icônes système génériques | Pas d'icône `.ico` custom — v0.4.0 utilise les icônes système |
| Délai de détection | Jusqu'à 5s après un changement d'état |
| Frontend non contrôlé | Le tray contrôle le backend seulement |
| Throttle 60s | Max 1 notification par minute par type d'événement |
| Windows 10+ requis | `System.Windows.Forms` v4.x — non testé sur Windows 7/8 |
