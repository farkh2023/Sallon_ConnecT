# Guide du scheduler

Le scheduler execute des taches locales controlees. Il sert a automatiser des controles simples sans lancer d'actions dangereuses.

## Taches planifiees locales

Les taches sont stockees localement et executees par le backend si le scheduler est active.

## Actions sures

Les actions autorisees incluent par exemple :

- health check systeme
- statut des integrations
- snapshot d'observabilite
- nettoyage de notifications
- verification de sauvegarde

## Actions bloquees

Les actions suivantes restent bloquees par securite :

- Scene SmartThings automatique
- Commande TV automatique
- Streaming automatique
- Restauration backup automatique
- Suppression ou deplacement libre de fichiers
- Commande ADB destructive

## Execution manuelle

Vous pouvez lancer une tache autorisee manuellement depuis la section `Taches`. Le backend verifie toujours l'action avant execution.

## Historique

L'historique indique les dernieres executions, leur statut et leur duree. Il reste local.

## Notifications de resultat

Une tache peut creer une notification de succes ou d'erreur selon sa configuration.

## Regle centrale

Aucune scene SmartThings, aucune commande TV et aucun streaming ne doivent partir automatiquement depuis le scheduler.
