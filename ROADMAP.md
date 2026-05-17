# Roadmap — Sallon-ConnecT

## Statut actuel : v0.1.0 — Prototype local complet

Phases 1–22 terminées. Le hub fonctionne localement, est testé, documenté et prêt pour GitHub.

---

## Phases réalisées

| Phase | Description | Statut |
|---|---|---|
| 1–4 | Infrastructure backend/frontend, données JSON | ✅ |
| 5 | Scénarios intelligents | ✅ |
| 6 | ADB lecture seule | ✅ |
| 7 | DLNA découverte passive | ✅ |
| 8–9 | SmartThings Samsung TV opt-in | ✅ |
| 10 | Scènes SmartThings | ✅ |
| 11 | Streaming assisté | ✅ |
| 12 | Notifications locales | ✅ |
| 13 | Scheduler local | ✅ |
| 14–15 | PWA + mode TV | ✅ |
| 16 | Packaging Windows portable | ✅ |
| 17–17B | Tests automatisés + CI GitHub Actions | ✅ |
| 18–18B | Observabilité + snapshots | ✅ |
| 19 | Graphes temporels Recharts | ✅ |
| 20 | Profils utilisateurs locaux | ✅ |
| 21–21B | Sauvegarde locale sécurisée + isolation tests | ✅ |
| 22 | Publication GitHub | ✅ |

---

## Prochaines phases

### Phase 23 — Documentation utilisateur finale
- Guide d'utilisation complet pour utilisateurs non-techniques
- Tutoriels vidéo ou GIF animés
- FAQ et dépannage détaillé
- Documentation des APIs pour développeurs

### Phase 24 — Assistant vocal local
- Intégration d'un moteur de reconnaissance vocale local (Whisper, Vosk)
- Commandes vocales pour contrôle TV, scénarios, profils
- Sans cloud, sans collecte de données
- Wake word configurable

### Phase 25 — Profils avancés / permissions fines
- Permissions par section et par action (granularité niveau champ)
- Profils temporaires avec expiration automatique
- PIN optionnel pour profils sensibles
- Héritage de permissions entre profils

### Phase 26 — Installateur Windows
- Installateur NSIS ou WiX pour Windows 10/11
- Mise à jour automatique locale (sans cloud)
- Démarrage au boot (service Windows optionnel)
- Désinstallation propre

### Phase 27 — Mode multi-pièces
- Détection de la pièce active (réseau, Bluetooth, géolocalisation locale)
- Tableau de bord adaptatif par pièce
- Diffusion multicast DLNA par zone
- Profils liés aux pièces

### Phase 28 — Intégrations domotiques avancées
- Zigbee/Z-Wave via passerelle locale (Zigbee2MQTT)
- HomeAssistant bridge (API locale uniquement)
- Philips Hue local API
- Thermostats et capteurs locaux
- Dashboard domotique unifié

---

## Vision long terme

Sallon-ConnecT vise à devenir un **hub domotique personnel complet**, 100% local, sans abonnement cloud, contrôlable depuis n'importe quel écran du foyer.

*Mis à jour : 2026-05-17*
