# Guide assistant vocal local

L'assistant vocal de Sallon-ConnecT permet de piloter des commandes simples du dashboard. Il reste local au navigateur et ne lance aucune action sensible automatiquement.

## Activer l'assistant

1. Demarrez le backend et le frontend.
2. Ouvrez http://localhost:3001.
3. Cliquez sur `Assistant vocal` dans la barre du haut.
4. Cliquez sur `Micro` pour demarrer l'ecoute.

L'ecoute ne demarre jamais automatiquement. Elle doit etre declenchee par un clic utilisateur.

## Navigateurs compatibles

La reconnaissance vocale utilise les APIs navigateur disponibles localement, par exemple Web Speech API si le navigateur la propose.

Si la reconnaissance vocale n'est pas disponible, le panneau affiche un champ texte de secours.

## Commandes disponibles

Navigation :

- `ouvre le hub`
- `ouvre les appareils`
- `ouvre les agents`
- `ouvre les medias`
- `ouvre les scenarios`
- `ouvre les notifications`
- `ouvre l'observabilite`
- `ouvre les taches`
- `ouvre les profils`
- `ouvre la sauvegarde`

Actions sures :

- `actualise`
- `scanne le statut`
- `affiche les notifications`
- `affiche les taches`
- `affiche l'observabilite`
- `active le mode TV`
- `desactive le mode TV`
- `plein ecran`
- `quitte le plein ecran`
- `aide vocale`
- `statut du systeme`

## Commandes refusees

Ces commandes sont bloquees :

- allumer ou eteindre la TV
- executer une scene SmartThings
- lancer un film ou une video
- lancer le streaming
- restaurer une sauvegarde
- supprimer un audit
- vider les notifications
- changer de profil

## Fallback texte

Si le micro n'est pas disponible, tapez la commande dans le champ texte du panneau vocal. Les memes regles de securite s'appliquent.

## Securite

- Aucun cloud.
- Aucun appel OpenAI, Google Cloud, Azure, Firebase ou service externe.
- Audio non stocke.
- Historique de transcription limite et en memoire uniquement.
- Transcriptions affichees masquees.
- Actions sensibles bloquees cote frontend et toujours protegees cote backend.

## Depannage micro

- Verifiez que le navigateur autorise le micro.
- Verifiez que le micro fonctionne dans Windows.
- Essayez Chrome ou Edge.
- Utilisez le fallback texte si le navigateur ne supporte pas la reconnaissance vocale.
- Fermez puis rouvrez le panneau vocal si l'ecoute reste bloquee.
