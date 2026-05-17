# Guide utilisateur

Ce guide decrit les sections principales du dashboard Sallon-ConnecT.

## Navigation principale

La barre du haut permet d'aller directement aux sections :

- Hub
- Appareils
- Agents
- Medias
- Scenarios
- Notifications
- Observabilite
- Taches
- Profils
- Sauvegarde

## Hub

Le Hub presente l'etat general du serveur local, la phase courante et le nombre d'appareils connus. Le bouton de scan rafraichit les statuts disponibles.

Reel : le health check backend et les appels API locaux.

## Appareils

La section Appareils affiche les appareils declares dans les donnees locales et leur etat connu.

Reel : les statuts locaux disponibles.

Simule ou limite : les appareils non configures restent en etat neutre.

## Agents

La section Agents presente les roles logiques du hub. Elle aide a comprendre comment les fonctions sont organisees.

Simule : les agents ne lancent pas d'actions sensibles automatiquement.

## Medias

La section Medias regroupe ADB, DLNA, SmartThings et streaming assiste.

Reel si active : les diagnostics et statuts locaux.

Bloque par securite : ecriture ADB, scene SmartThings automatique, commande TV automatique, streaming automatique.

## Scenarios

Les scenarios proposent des routines comme cinema, travail, famille ou diagnostic.

Reel : previsualisation et logique locale.

Bloque par securite : execution sensible sans confirmation, action non allowlistee, action qui contourne le backend.

## Notifications

Les notifications affichent les evenements locaux du hub : informations, succes, warnings, erreurs et alertes securite.

Reel : stockage local et filtrage.

Bloque par securite : aucune notification cloud obligatoire.

## Observabilite

L'observabilite affiche l'etat du backend, du runtime, de la securite, des tests et des snapshots.

Reel : indicateurs locaux et exports non sensibles.

Bloque par securite : logs bruts, chemins complets, secrets et IP completes.

## Taches

Les taches planifiees sont locales et limitees a des actions sures.

Reel : execution manuelle d'actions allowlistees.

Bloque par securite : commandes TV, scenes SmartThings, streaming automatique, restauration backup automatique.

## Profils

Les profils adaptent l'affichage et les permissions : Principal, Famille, Invite, TV, Diagnostic.

Important : un profil ne contourne jamais les protections backend.

## Sauvegarde

La section Sauvegarde permet de creer, verifier et restaurer une sauvegarde locale.

Reel : ZIP local avec manifest.

Bloque par securite : restauration sans dry-run, restauration sans confirmation, inclusion de secrets.
