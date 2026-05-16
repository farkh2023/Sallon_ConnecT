# Phase 15 - PWA et mode TV avance

## Objectif

La Phase 15 ajoute une couche PWA et une vue TV avancee au frontend Next.js sans modifier le backend Express ni supprimer l'ancien `index.html`.

Principes conserves:

- projet local uniquement;
- aucun Firebase, aucun push cloud;
- aucune action sensible declenchee automatiquement;
- aucun token, ID complet, chemin complet ou IP complete affiche;
- aucune reponse API sensible stockee en cache navigateur.

## Architecture PWA

Fichiers ajoutes cote frontend:

- `frontend/public/manifest.webmanifest`;
- `frontend/public/sw.js`;
- `frontend/public/icons/icon-192.png`;
- `frontend/public/icons/icon-512.png`;
- `frontend/public/icons/maskable-192.png`;
- `frontend/public/icons/maskable-512.png`;
- `frontend/src/components/pwa/ServiceWorkerRegister.tsx`;
- `frontend/src/components/pwa/InstallPrompt.tsx`;
- `frontend/src/components/pwa/OfflineStatus.tsx`;
- `frontend/src/app/offline/page.tsx`.

Le service worker est enregistre seulement en production ou en developpement si `NEXT_PUBLIC_ENABLE_SW=true`.

## Manifest

Le manifest declare `Sallon-ConnecT`, le mode `standalone`, le scope `/`, la couleur `#0A2540`, les categories PWA et les icones PNG standard/maskable.

URL de verification:

```powershell
http://localhost:3001/manifest.webmanifest
```

## Service Worker

Le service worker utilise un cache minimal `sallon-connect-static-v15`.

Cache autorise:

- `/`;
- `/offline`;
- `/manifest.webmanifest`;
- icones PWA;
- assets statiques Next.js sous `/_next/static/`.

Strategie:

- navigation en network-first;
- fallback vers `/offline` si la navigation echoue;
- assets statiques en cache-first apres premiere lecture;
- requetes non-GET transmises directement au reseau.

Interdictions:

- pas de cache pour `/api/*`;
- pas de cache pour notifications;
- pas de cache pour SmartThings;
- pas de cache pour ADB;
- pas de cache pour DLNA;
- pas de cache pour streaming;
- pas de cache pour scheduler;
- pas de cache pour runtime.

## Limites Offline

Le mode offline n'est pas un mode de donnees. Il sert uniquement a afficher une page claire quand le reseau ou le backend local ne repond plus.

La page `/offline` ne contient pas de donnees runtime. Les audits, tokens, statuts API et notifications ne sont jamais stockes hors ligne.

## Mode TV

Le mode TV est une couche client activee par bouton ou raccourci clavier. Il ajoute cartes grand ecran, contraste fort, focus visible, grille d'actions rapides, plein ecran, statut backend, appareils, Smart TV, ADB, DLNA, SmartThings, streaming, notifications, prochaines taches et dernier evenement securite.

Les actions rapides restent sures:

- actualiser les statuts;
- ouvrir les notifications;
- ouvrir les taches;
- ouvrir le centre multimedia;
- basculer mode TV;
- basculer plein ecran.

Aucune commande TV, scene SmartThings, action streaming ou action scheduler sensible n'est declenchee par raccourci.

## Raccourcis Clavier

| Touche | Action |
|---|---|
| `T` | Activer/desactiver le mode TV |
| `F` | Basculer plein ecran si disponible |
| `R` | Rafraichir le dashboard TV |
| `N` | Aller aux notifications |
| `S` | Aller aux taches scheduler |
| `Echap` | Quitter le panneau actif ou le plein ecran |
| Fleches | Naviguer dans la grille TV |
| `Entree` | Executer l'action sure selectionnee |

Les raccourcis sont ignores dans les champs de saisie.

## Securite Cache et Affichage

Helpers client ajoutes dans `frontend/src/lib/safety.ts`:

- `isSafeDisplayText()`;
- `maskSensitiveClientText()`;
- `preventSensitiveCache()`;
- `safeNotificationMessage()`.

Les erreurs API affichees cote frontend passent par un masquage client. Les appels API frontend utilisent `cache: 'no-store'`.

## Commandes de Test

Depuis la racine:

```powershell
npm run dev
```

Ou separement:

```powershell
npm start
cd frontend
npm run dev -- --port 3001
```

Build:

```powershell
cd frontend
npm run build
```

Test manuel:

- ouvrir `http://localhost:3001`;
- verifier `http://localhost:3001/manifest.webmanifest`;
- verifier `http://localhost:3001/offline`;
- lancer avec `NEXT_PUBLIC_ENABLE_SW=true` pour tester le service worker en dev;
- activer le mode TV avec le bouton ou `T`;
- tester le plein ecran avec `F`;
- tester `R`, `N`, `S`, `Echap`, fleches et `Entree`;
- arreter le backend port 3000 et verifier le badge `Backend local indisponible`;
- verifier que `http://localhost:3000` continue de servir l'ancien frontend.

## Prochaines Etapes

- Ajouter un test Playwright PWA/TV si le projet adopte une suite E2E.
- Ajouter une validation Lighthouse PWA en production locale.
- Ajouter des icones plus travaillees si une charte graphique definitive est fournie.
