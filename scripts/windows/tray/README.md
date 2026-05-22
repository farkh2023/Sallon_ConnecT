# Sallon-ConnecT Tray

Interface Windows Tray (zone de notification) pour contrôler rapidement Sallon-ConnecT.

## Lancement

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\tray\start-tray.ps1
```

## Arrêt

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\tray\stop-tray.ps1
```

## Statut

```powershell
powershell -ExecutionPolicy Bypass -File scripts\windows\tray\tray-status.ps1
```

## Menu clic droit (zone de notification)

| Option | Action |
|--------|--------|
| Ouvrir Sallon-ConnecT | Ouvre http://localhost:3001 dans le navigateur |
| Démarrer le backend | Lance start-service.ps1 |
| Arrêter le backend | Lance stop-service.ps1 |
| Redémarrer le backend | Lance restart-service.ps1 |
| Statut détaillé | Ouvre service-status.ps1 dans une fenêtre visible |
| Ouvrir les logs | Ouvre le dossier logs/ dans l'explorateur |
| Documentation | Ouvre le dossier docs/ dans l'explorateur |
| Quitter le tray | Ferme le tray (le backend continue de tourner) |

Double-clic gauche sur l'icône = ouvre le dashboard.

## Icônes d'état

| Icône | Signification |
|-------|---------------|
| Info (bleue) | Backend en ligne |
| Avertissement (jaune) | Backend arrêté |
| Erreur (rouge) | Backend dégradé |
| Application | Vérification en cours |

## Notifications

Le tray envoie des notifications Windows locales (bulle) avec un throttle de 60 secondes par type d'événement :
- Backend démarré
- Backend arrêté
- Backend dégradé

## Technique

- Implémentation : PowerShell 5.1 + System.Windows.Forms.NotifyIcon
- Polling : toutes les 5 secondes sur http://localhost:3000/api/health
- PID file : %TEMP%\SallonConnecT-Tray.pid
- Aucune dépendance externe
- Aucun secret embarqué
- Local-only
