# FAQ

## Est-ce que Sallon-ConnecT envoie mes donnees au cloud ?

Non. Le projet est local-first. Le dashboard et le backend tournent sur votre machine. Les integrations externes, comme SmartThings, sont optionnelles.

## Est-ce que SmartThings est obligatoire ?

Non. Le dashboard fonctionne sans SmartThings. Si SmartThings est desactive, les panneaux affichent un statut limite.

## Est-ce que ADB lit mes photos ?

Non par defaut. ADB est en lecture seule et sert au diagnostic. Aucune copie de fichiers personnels ne doit etre lancee automatiquement.

## Est-ce que le streaming est automatique ?

Non. Le streaming est assiste et protege. Aucun scenario ou raccourci ne doit lancer un streaming automatiquement.

## Est-ce que je peux utiliser seulement le dashboard ?

Oui. Vous pouvez utiliser le dashboard pour consulter les statuts, notifications, profils, sauvegardes et observabilite sans activer les integrations.

## Est-ce que le mode TV lance des commandes ?

Non. Le Mode TV change l'affichage. Il ne lance pas de commande sensible.

## Est-ce que l'assistant vocal utilise un cloud ?

Non. Il utilise uniquement les APIs disponibles dans le navigateur et un fallback texte. Aucune API cloud n'est appelee par Sallon-ConnecT pour l'assistant vocal.

## Est-ce que l'assistant vocal peut lancer une action sensible ?

Non. Les commandes TV, scenes SmartThings, streaming, restauration backup, suppression d'audit, vidage notifications et changement de profil sont bloques.

## Est-ce que l'installateur Windows cree un MSI ?

Non. La Phase 25 fournit des scripts PowerShell et `.bat` locaux. Aucun MSI ni service Windows n'est cree automatiquement.

## Est-ce que l'installateur ecrase mon `.env` ?

Non. Si `.env` ou `frontend/.env.local` existe deja, le script le conserve. Les fichiers sont crees depuis les exemples uniquement s'ils sont absents.

## Comment reparer une installation locale ?

Utilisez :

```powershell
scripts\windows\install\repair-sallon-connect.bat
```

La reparation recree les dossiers et raccourcis manquants sans supprimer vos donnees.

## Ou sont stockees les donnees ?

Les donnees versionnees sont dans `data/`. Les etats locaux sont dans `runtime/`. Les logs et rapports sont dans `logs/`. Les sauvegardes sont dans `backups/`. Les dossiers locaux sensibles sont ignores par Git.

## Qu'est-ce qui est exclu des sauvegardes ?

Les secrets, `.env`, les dependances, les logs bruts, les anciens ZIP de sauvegarde, `.git/`, `.next/`, les cles et certificats.

## Comment arreter proprement ?

Utilisez :

```powershell
scripts\windows\stop-sallon-connect.bat
```

## Comment publier sur GitHub sans secrets ?

Lancez :

```powershell
npm run check
powershell -ExecutionPolicy Bypass -File scripts\release\preflight-github.ps1
```

Verifiez que le preflight ne signale aucun fichier interdit ni secret probable, puis commitez uniquement les fichiers attendus.
