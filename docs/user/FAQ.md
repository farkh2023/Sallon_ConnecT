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
