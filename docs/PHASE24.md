# Phase 24 - Assistant vocal local

## Objectif

La Phase 24 ajoute un assistant vocal local cote frontend pour des commandes simples et sures. Il sert a naviguer dans le dashboard, actualiser l'interface, ouvrir certains panneaux, activer le mode TV et demander le plein ecran.

## Architecture

| Couche | Fichiers | Role |
|---|---|---|
| Types | `frontend/src/lib/types.ts` | Types de commandes et resultats vocaux |
| Securite | `frontend/src/lib/voiceSafety.ts` | Masquage, classification sensible, allowlist |
| Commandes | `frontend/src/lib/voiceCommands.ts` | Parsing et execution UI sure |
| Hook | `frontend/src/hooks/useVoiceAssistant.ts` | Web Speech API, fallback texte, historique memoire |
| UI | `frontend/src/components/voice/` | Panneau vocal, bouton micro, aide, notice |
| Integration | `AppShell.tsx`, `TopNav.tsx` | Bouton Assistant vocal et raccourci `V` |

## Web Speech API et fallback

Le hook utilise `SpeechRecognition` ou `webkitSpeechRecognition` si le navigateur les fournit. Si l'API est absente, le panneau reste utilisable avec un champ texte.

L'ecoute ne demarre jamais automatiquement. Elle commence uniquement apres action utilisateur.

## Securite

- Aucun cloud.
- Aucun stockage audio.
- Aucun stockage persistant de transcription.
- Historique limite en memoire.
- Transcriptions masquees avant affichage.
- Aucune action sensible appelee directement.
- Les protections backend restent obligatoires.

## Commandes autorisees

- Navigation vers les sections du dashboard.
- Actualisation UI.
- Ouverture Notifications.
- Ouverture Taches.
- Ouverture Observabilite.
- Activation ou desactivation Mode TV.
- Plein ecran ou sortie plein ecran.
- Aide vocale.
- Statut systeme.

## Commandes bloquees

- Scene SmartThings.
- Commande TV.
- Lecture streaming.
- Restauration backup.
- Suppression audit.
- Vidage notifications.
- Changement de profil.

## Tests

Tests ajoutes :

- `frontend/src/__tests__/voice/voiceSafety.test.ts`
- `frontend/src/__tests__/voice/voiceCommands.test.ts`
- `frontend/src/__tests__/components/VoiceAssistantPanel.test.tsx`

Ils verifient le parsing, le refus des commandes sensibles, le masquage des transcriptions et le fallback texte sans micro reel.

## Limites actuelles

- La reconnaissance vocale depend du navigateur.
- Le wake word est une convention de confort, pas une ecoute permanente.
- Pas de synthese vocale.
- Pas de confirmation vocale pour actions sensibles : elles sont bloquees.

## Prochaines etapes

- Ajouter une confirmation manuelle explicite pour certaines actions non destructives.
- Ameliorer les synonymes de commandes.
- Ajouter une page d'aide utilisateur integree.
