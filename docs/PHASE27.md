# Phase 27 — Centre d'aide intégré dans le dashboard

## Objectif

Créer un Centre d'aide intégré directement dans le dashboard Next.js de Sallon-ConnecT. Le Centre d'aide permet à l'utilisateur d'accéder rapidement au manuel, aux TP, à la FAQ, au dépannage, aux commandes utiles et à l'état système, sans quitter l'interface.

## Architecture Centre d'aide

```
frontend/src/
  components/help/
    HelpCenterPanel.tsx      Panneau glissant principal (dialog)
    HelpQuickStart.tsx       Démarrage rapide en 5 étapes
    HelpSearch.tsx           Recherche locale + filtres par catégorie
    HelpTopics.tsx           14 sujets couverts
    HelpPracticalLabs.tsx    12 travaux pratiques guidés
    HelpCommands.tsx         Commandes par catégorie avec bouton Copier
    HelpFaq.tsx              9 questions fréquentes (accordéons)
    HelpTroubleshooting.tsx  10 problèmes courants (accordéons)
    HelpSystemStatus.tsx     État système via endpoints sûrs
    HelpSafetyNotice.tsx     Bloc actions bloquées
    HelpLinks.tsx            Liens documentation et pages internes
  hooks/
    useHelpCenter.ts         State : recherche, catégorie, statut système
  lib/
    helpSafety.ts            maskHelpText, isSafeHelpCommand, sanitizeHelpSearch
  app/
    aide/page.tsx            Page /aide dédiée (plein écran)
```

## Composants créés

| Composant | Rôle |
|---|---|
| HelpCenterPanel | Panneau glissant avec 7 onglets, accessible via bouton Aide ou touche ? |
| HelpQuickStart | 5 étapes avec commandes copiables |
| HelpSearch | Recherche locale + 10 filtres de catégorie |
| HelpTopics | 14 sujets en grille |
| HelpPracticalLabs | 12 TP avec objectif, commande, résultat attendu |
| HelpCommands | 17 commandes groupées par catégorie |
| HelpFaq | 9 accordéons FAQ |
| HelpTroubleshooting | 10 problèmes / solutions avec accordéons |
| HelpSystemStatus | Tableau d'état en temps réel |
| HelpSafetyNotice | Actions bloquées listées |
| HelpLinks | 10 liens docs et pages internes |

## Endpoints sûrs utilisés

| Endpoint | Usage |
|---|---|
| /api/health | Statut backend, phase |
| /api/notifications/stats | Notifications non lues |
| /api/scheduler/status | Scheduler actif |
| /api/observability/overview | Observabilité OK, sécurité localOnly |
| /api/backup/status | Backup disponible |

Ne sont jamais affichés : token, IP complète, chemin absolu, contenu runtime, contenu logs.

## Accès dans le dashboard

- Bouton **Aide** dans le TopNav (près de Mode TV)
- Raccourci clavier **?** pour ouvrir/fermer le panneau
- Lien **Plein écran** vers `/aide` depuis le panneau
- Page dédiée accessible sur **http://localhost:3001/aide**

## Sécurité

- `helpSafety.ts` fournit `maskHelpText`, `isSafeHelpCommand`, `sanitizeHelpSearch`, `getBlockedHelpActions`
- Aucune action sensible exécutable depuis le Centre d'aide
- Commandes bloquées : SmartThings scene execute, TV command execute, streaming play, backup restore, audit delete, notification clear, profile sensitive change
- `localStorage` non utilisé (progression dans le manuel HTML uniquement)
- Aucun appel API externe, aucune télémétrie

## Travaux pratiques intégrés

12 TP couvrant l'installation, le lancement, la santé, le réseau, le mode TV, l'assistant vocal, la sauvegarde, l'observabilité et la release.

## Tests

| Test | Fichier |
|---|---|
| Rendu panneau, onglets, liens, fermeture | frontend/src/__tests__/components/HelpCenterPanel.test.tsx |
| maskHelpText, isSafeHelpCommand, sanitizeHelpSearch | frontend/src/__tests__/help/helpSafety.test.ts |

## Limites actuelles

- HelpSystemStatus nécessite le backend actif pour afficher des données réelles (fallback gracieux si indisponible)
- La recherche est locale et statique (pas d'indexation full-text)
- Aucune persistance de progression dans le Centre d'aide Next.js (voir la version HTML pour localStorage)

## Prochaines étapes possibles

- Phase 28 : Historique des recherches locales (localStorage)
- Phase 28 : Lien direct vers une section du manuel depuis un TP
- Phase 28 : Chatbot d'aide local basé sur les données statiques
