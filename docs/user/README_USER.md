# Documentation utilisateur - Sallon-ConnecT

Sallon-ConnecT est un tableau de bord local pour suivre et piloter les fonctions du salon connecte depuis un navigateur. Il sert a centraliser les appareils, les medias, les scenarios, les notifications, les taches, les profils et les sauvegardes.

La plateforme est prevue pour fonctionner sur votre machine et votre reseau local. Elle n'a pas besoin de cloud pour afficher le dashboard.

## Ce que vous pouvez faire

- Ouvrir un dashboard local depuis un PC, une tablette ou une TV.
- Voir les sections Hub, Appareils, Agents, Medias, Scenarios, Notifications, Observabilite, Taches, Profils et Sauvegarde.
- Installer l'interface comme PWA sur un navigateur compatible.
- Utiliser le Mode TV pour un affichage plein ecran.
- Creer une sauvegarde locale controlee.
- Consulter les notifications locales et les resultats de taches.
- Verifier l'etat du backend et du frontend.

## Adresses locales

| Service | Adresse |
|---|---|
| Backend Express | http://localhost:3000 |
| Frontend Next.js | http://localhost:3001 |

## Guides

| Guide | Quand l'utiliser |
|---|---|
| [Quick Start Windows](QUICK_START_WINDOWS.md) | Installer et demarrer rapidement |
| [Guide utilisateur](USER_GUIDE.md) | Comprendre les sections du dashboard |
| [Mode TV](TV_MODE_GUIDE.md) | Utiliser l'affichage plein ecran |
| [Assistant vocal](VOICE_ASSISTANT_GUIDE.md) | Utiliser les commandes vocales locales |
| [Installateur Windows](INSTALLER_WINDOWS_GUIDE.md) | Installer, reparer et desinstaller doucement |
| [Installation PWA](PWA_INSTALL_GUIDE.md) | Installer depuis Chrome ou Edge |
| [Sauvegarde / restauration](BACKUP_RESTORE_GUIDE.md) | Creer, verifier et restaurer une sauvegarde |
| [Profils](PROFILES_GUIDE.md) | Comprendre les profils et permissions |
| [Notifications](NOTIFICATIONS_GUIDE.md) | Lire, filtrer et vider les notifications |
| [Scheduler](SCHEDULER_GUIDE.md) | Comprendre les taches locales |
| [Observabilite](OBSERVABILITY_GUIDE.md) | Lire les indicateurs, snapshots et exports |
| [Depannage](TROUBLESHOOTING.md) | Resoudre les problemes courants |
| [FAQ](FAQ.md) | Reponses rapides |

## Securite en bref

Ne mettez jamais de secret dans la documentation, dans une issue ou dans Git. Le fichier `.env` reel reste local. Les dossiers `runtime/`, `logs/`, `backups/`, `node_modules/` et `.next/` ne doivent pas etre publies.

SmartThings, ADB, DLNA et le streaming sont optionnels. Les actions sensibles restent protegees par le backend, meme si un profil ou un raccourci clavier est utilise.
