# Guide observabilite

La section Observabilite aide a comprendre l'etat local du hub.

## Tableau Observabilite

Le tableau regroupe plusieurs blocs :

- health backend
- securite
- runtime
- logs
- tests
- integrations
- snapshots

## Health dashboard

Le health dashboard indique si le backend repond et donne des informations non sensibles sur l'etat du service.

## Snapshots

Les snapshots enregistrent des resumes d'etat. Ils permettent de suivre l'evolution du hub sans stocker de donnees sensibles.

## Graphes temporels

Les graphes affichent les tendances de statut, scores et integrations. Ils servent au diagnostic visuel.

## Export JSON / CSV

Les exports sont prevus pour etre non sensibles. Ils ne doivent pas contenir de secret, logs bruts, chemins complets ou IP completes.

## Securite

L'observabilite ne doit pas exposer :

- logs bruts
- chemins complets
- secrets
- IP complete
- identifiants complets
- contenu de `.env`

## Quand utiliser cette section

- Apres un demarrage.
- Avant une sauvegarde.
- Si une integration ne repond pas.
- Avant de lancer un preflight release.
