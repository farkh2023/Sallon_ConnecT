# Placeholders captures utilisateur

Les captures automatiques n'ont pas ete generees pendant la Phase 34 car l'outil de pilotage navigateur n'etait pas disponible dans la session.

Avant une publication visuelle, remplacer ces placeholders par des images PNG nommees :

| Fichier attendu | Ecran a capturer | Verification UX |
|---|---|---|
| `dashboard.png` | Dashboard principal `http://localhost:3001` | Statut backend visible, sections lisibles, aucun chevauchement. |
| `notifications.png` | Centre de notifications | Notifications locales, filtres, etats non lus. |
| `diagnostics.png` | Tableau diagnostics | Cartes Backend, SSE, Scheduler, Backup, Notifications, Securite. |
| `observability.png` | Observabilite | Health, runtime, logs masques, snapshots, graphes. |
| `help-center.png` | Centre d'aide `/aide` | Recherche, FAQ, commandes, statut systeme. |

Regles de capture :

- utiliser une installation propre release ;
- ne jamais afficher de secret ou token ;
- masquer les chemins personnels si visibles ;
- verifier desktop et mobile si possible ;
- conserver les PNG dans ce dossier.
