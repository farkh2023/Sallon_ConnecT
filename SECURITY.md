# Security Policy — Sallon-ConnecT

## Modèle de sécurité

Sallon-ConnecT est un **hub personnel local**. Il n'est pas conçu pour être exposé à Internet.

Toutes les données restent sur votre machine. Aucune télémétrie, aucun service cloud.

---

## Principes

| Principe | Détail |
|---|---|
| Local uniquement | Aucune donnée envoyée vers l'extérieur |
| Pas de secrets commités | `.env`, tokens, clés → jamais dans Git |
| Runtime ignoré | `runtime/*.json` non versionné |
| Opt-in pour les intégrations | SmartThings, ADB, DLNA désactivés par défaut |
| Confirmation explicite | Restauration backup, actions sensibles |
| Audit trail | Toutes les actions sensibles sont journalisées localement |

---

## Secrets et configuration

- **Tous les secrets** sont dans `.env` (non commité, ignoré par Git)
- **Exemple sans secret** : `.env.example` (commité, valeurs vides ou exemples)
- **Frontend** : `frontend/.env.local` ignoré, `frontend/.env.example` commité
- **Token SmartThings** : jamais affiché, jamais loggué, jamais inclus dans les sauvegardes

---

## Intégrations sécurisées

### SmartThings Samsung TV
- Désactivé par défaut (`SMARTTHINGS_ENABLED=false`)
- Token Bearer masqué dans toutes les réponses API
- Exécution de scènes opt-in (`SMARTTHINGS_ALLOW_SCENE_EXECUTION=false`)
- Commandes TV opt-in (`SMARTTHINGS_TV_COMMANDS_ENABLED=false`)

### ADB (Android Debug Bridge)
- Lecture seule uniquement (diagnostics, statut)
- Aucune écriture sur l'appareil autorisée via l'API
- Désactivé par défaut (`ADB_ENABLED=false`)

### DLNA/UPnP
- Découverte passive uniquement
- Pas de streaming forcé
- Désactivé par défaut (`DLNA_ENABLED=false`)

### Streaming assisté
- Indexation locale uniquement
- Désactivé par défaut (`MEDIA_STREAMING_ENABLED=false`)

---

## Sauvegarde locale

- Sauvegardes ZIP locales uniquement, jamais vers le cloud
- Fichiers exclus : `.env`, `node_modules`, `.git`, `*.pem`, `*.key`, logs bruts
- Chemins absolus masqués dans tous les manifests
- Dry-run obligatoire avant restauration
- Code de confirmation explicite requis (`CONFIRMER_BACKUP`)
- Rollback créé automatiquement avant chaque restauration

---

## Profils utilisateurs

- Stockage local uniquement (`runtime/user-profiles.json`)
- Pas de mot de passe en clair
- Pas de donnée personnelle sensible
- Mode lecture seule par profil (guest, tv)
- Permissions par action (17 contrôles)

---

## Ce qui n'est jamais exposé via l'API

- Token complet (SmartThings ou autre)
- IP complète (masquée ou tronquée)
- Chemin absolu complet
- ID complet sensible (tronqué à 8–16 chars)
- Contenu des fichiers `.env`
- IMEI, numéro de téléphone, numéro de série

---

## Signalement d'un problème

Ce projet est un hub personnel local. En cas de problème de sécurité :

1. Vérifiez que votre `.env` n'est pas commité (`git ls-files .env`)
2. Vérifiez que `runtime/` n'est pas commité
3. Lancez `scripts/release/preflight-github.ps1` pour un audit complet

Pour toute question : ouvrez une issue GitHub avec le label `security`.
Ne jamais inclure de token ou secret dans une issue.

---

## Versions supportées

| Version | Support |
|---|---|
| 0.1.0 | ✅ Actuelle |

*Mis à jour : 2026-05-17*
