# Guide sauvegarde et restauration

Les sauvegardes Sallon-ConnecT sont locales et controlees. Elles servent a conserver une copie du projet et de certains etats autorises.

## Creer une sauvegarde sure

1. Ouvrez le dashboard.
2. Allez dans `Sauvegarde`.
3. Lancez une creation de sauvegarde.
4. Verifiez le resultat et le nom du ZIP.

Le ZIP est stocke localement dans `backups/` ou dans l'emplacement configure.

## Verifier une sauvegarde

La verification controle la presence du manifest et les informations de base. Elle ne doit pas afficher de secret.

## Lire le manifest

Le manifest decrit le contenu de la sauvegarde et contient des empreintes SHA256. Il sert a verifier l'integrite sans exposer les chemins complets.

## Faire un dry-run

Avant une restauration, lancez toujours un dry-run. Le dry-run liste ce qui serait restaure sans modifier les fichiers.

## Restaurer avec confirmation

La restauration demande une confirmation explicite. Sans dry-run valide et sans code de confirmation, elle est refusee.

## Rollback automatique

Avant restauration, Sallon-ConnecT cree un rollback local quand l'option est activee. Cela permet de revenir en arriere si la restauration echoue.

## Ce qui n'est jamais sauvegarde

- `.env`
- Tokens et secrets
- `node_modules/`
- `frontend/node_modules/`
- Logs bruts
- ZIP de sauvegarde existants
- Runtime sensible
- `.git/`
- `.next/`
- Cles et certificats

## Bonnes pratiques

- Gardez les sauvegardes hors Git.
- Ne partagez jamais un ZIP sans verifier son contenu.
- Lancez le preflight avant toute publication GitHub.
