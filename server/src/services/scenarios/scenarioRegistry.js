'use strict';
/* =============================================
   scenarioRegistry.js — Définitions des scénarios Phase 5
   Chaque scénario est en lecture seule depuis ce registre.
   Aucune donnée personnelle, aucun token, aucune action réelle.
============================================= */

const SCENARIOS = [
  {
    id: 'cinema',
    name: 'Mode Cinéma',
    description: 'Prépare l\'environnement salon pour regarder un film : TV, ambiance, sources vidéo.',
    icon: '🎬',
    requiredDevices: ['TV_Samsung_7_Series', 'PC_Bureau'],
    requiredServices: ['youtube-embed', 'dlna'],
    safetyLevel: 'safe',
    steps: [
      { id: 'check-tv',          label: 'Vérifier TV Samsung via SmartThings (lecture seule)',   type: 'check',   connector: 'smartthings' },
      { id: 'st-tv-status',      label: 'SmartThings : identifier TV Samsung si visible',         type: 'check',   connector: 'smartthings' },
      { id: 'st-scene-suggest',  label: 'SmartThings : proposer scène Cinéma allowlistée (confirmation avant exécution)', type: 'suggest', connector: 'smartthings' },
      { id: 'tv-cmd-suggest',    label: 'Phase 10 : proposer commande TV switch.on allowlistée (confirmation obligatoire — jamais auto)', type: 'suggest', connector: 'smartthings-tv' },
      { id: 'dlna-discover',     label: 'Découverte DLNA : chercher renderer/TV local',           type: 'check',   connector: 'dlna' },
      { id: 'check-youtube',     label: 'Vérifier service YouTube embed',                         type: 'check',   connector: 'youtube' },
      { id: 'prepare-preview',   label: 'Préparer zone aperçu TV',                               type: 'prepare', connector: null },
      { id: 'suggest-renderer',  label: 'Renderer DLNA détecté — disponible pour lecture future', type: 'suggest', connector: null },
      { id: 'streaming-suggest', label: 'Phase 11 : suggérer vidéo depuis médiathèque locale (preview avant confirmation)', type: 'suggest', connector: 'streaming' },
      { id: 'streaming-renderer',label: 'Phase 11 : afficher renderers DLNA autorisés (allowlist — jamais lecture auto)', type: 'suggest', connector: 'streaming' },
      { id: 'suggest-dim',       label: 'Suggérer baisse de luminosité',                         type: 'suggest', connector: null },
      { id: 'suggest-source',    label: 'Suggérer source vidéo',                                 type: 'suggest', connector: null },
      { id: 'summary',           label: 'Générer synthèse finale',                               type: 'summary', connector: null },
    ],
  },
  {
    id: 'travail',
    name: 'Mode Travail',
    description: 'Configure l\'espace de travail : affichage bureau, notifications minimales, concentration.',
    icon: '💼',
    requiredDevices: ['IA_ordinateur_BOM_WXX9', 'TV_Samsung_7_Series'],
    requiredServices: [],
    safetyLevel: 'safe',
    steps: [
      { id: 'check-pc',        label: 'Vérifier PC orchestrateur',       type: 'check',   connector: null },
      { id: 'check-display',   label: 'Vérifier affichage TV étendu',    type: 'check',   connector: 'smartthings' },
      { id: 'suggest-focus',   label: 'Suggérer mode concentration',     type: 'suggest', connector: null },
      { id: 'suggest-notif',   label: 'Suggérer désactivation notifs',   type: 'suggest', connector: null },
      { id: 'summary',         label: 'Synthèse environnement travail',  type: 'summary', connector: null },
    ],
  },
  {
    id: 'presentation',
    name: 'Mode Présentation',
    description: 'Prépare la TV comme écran de présentation avec source HDMI depuis le PC.',
    icon: '📊',
    requiredDevices: ['TV_Samsung_7_Series', 'IA_ordinateur_BOM_WXX9'],
    requiredServices: ['dlna'],
    safetyLevel: 'safe',
    steps: [
      { id: 'check-tv',           label: 'Vérifier disponibilité TV Samsung via SmartThings',          type: 'check',   connector: 'smartthings' },
      { id: 'st-tv-available',    label: 'SmartThings : confirmer TV disponible (lecture seule)',       type: 'check',   connector: 'smartthings' },
      { id: 'check-pc',           label: 'Vérifier PC source',                                         type: 'check',   connector: null },
      { id: 'dlna-renderer',      label: 'Découverte DLNA : vérifier renderer compatible',             type: 'check',   connector: 'dlna' },
      { id: 'suggest-renderer',   label: 'Renderer compatible détecté — prêt pour affichage futur',   type: 'suggest', connector: null },
      { id: 'suggest-manual-tv',  label: 'TV Samsung détectée — scène de présentation allowlistée proposée (confirmation requise)', type: 'suggest', connector: null },
      { id: 'tv-cmd-media',       label: 'Phase 10 : proposer mediaPlayback.play/pause si autorisé (confirmation requise — jamais auto)', type: 'suggest', connector: 'smartthings-tv' },
      { id: 'prepare-source',     label: 'Préparer source HDMI/DLNA (sans lancer de lecture)',         type: 'prepare', connector: 'dlna' },
      { id: 'streaming-pres',     label: 'Phase 11 : proposer image/vidéo depuis médiathèque (preview + confirmation)', type: 'suggest', connector: 'streaming' },
      { id: 'suggest-screen',     label: 'Suggérer mode écran TV',                                    type: 'suggest', connector: null },
      { id: 'summary',            label: 'Synthèse configuration présentation',                       type: 'summary', connector: null },
    ],
  },
  {
    id: 'famille',
    name: 'Mode Famille',
    description: 'Espace partagé sécurisé : contenus adaptés, accès centralisé aux playlists.',
    icon: '👨‍👩‍👧',
    requiredDevices: ['TV_Samsung_7_Series', 'Galaxy_S23_Ultra'],
    requiredServices: ['youtube-embed', 'local-gallery'],
    safetyLevel: 'safe',
    steps: [
      { id: 'check-tv',           label: 'Vérifier TV disponible',                          type: 'check',   connector: 'smartthings' },
      { id: 'check-gallery',      label: 'Vérifier galerie locale',                         type: 'check',   connector: 'local-gallery' },
      { id: 'check-phone-status', label: 'Vérifier disponibilité smartphone (ADB statut)',  type: 'check',   connector: 'adb' },
      { id: 'suggest-phone',      label: 'Smartphone disponible pour future galerie',        type: 'suggest', connector: null },
      { id: 'suggest-content',    label: 'Suggérer contenu familial (sans lire les photos)', type: 'suggest', connector: null },
      { id: 'streaming-family',   label: 'Phase 11 : proposer images/vidéos depuis médiathèque locale (confirmation requise)', type: 'suggest', connector: 'streaming' },
      { id: 'prepare-playlist',   label: 'Préparer playlist famille',                       type: 'prepare', connector: null },
      { id: 'summary',            label: 'Synthèse mode famille',                           type: 'summary', connector: null },
    ],
  },
  {
    id: 'veille',
    name: 'Mode Veille',
    description: 'Éteint les services actifs et prépare les appareils en état de veille sécurisé.',
    icon: '🌙',
    requiredDevices: ['TV_Samsung_7_Series'],
    requiredServices: [],
    safetyLevel: 'safe',
    steps: [
      { id: 'check-active',       label: 'Vérifier services actifs',                                          type: 'check',   connector: null },
      { id: 'st-list-veille',     label: 'SmartThings : lister scène "Veille" allowlistée (confirmation avant exécution)', type: 'check',   connector: 'smartthings' },
      { id: 'suggest-tv-off',     label: 'Proposer scène veille allowlistée (exécution uniquement après confirmation)',  type: 'suggest', connector: 'smartthings' },
      { id: 'tv-cmd-off',         label: 'Phase 10 : proposer commande TV switch.off allowlistée (confirmation avant envoi — jamais auto)', type: 'suggest', connector: 'smartthings-tv' },
      { id: 'suggest-devices',    label: 'Suggérer mise en veille appareils',                                 type: 'suggest', connector: null },
      { id: 'check-network',      label: 'Vérifier sécurité réseau local',                                   type: 'check',   connector: null },
      { id: 'summary',            label: 'Rapport veille sécurisée',                                         type: 'summary', connector: null },
    ],
  },
  {
    id: 'diagnostic',
    name: 'Mode Diagnostic réseau',
    description: 'Analyse l\'état du réseau local, détecte les appareils actifs et vérifie les services.',
    icon: '🔍',
    requiredDevices: ['Box_SFR_Fibre'],
    requiredServices: ['dlna'],
    safetyLevel: 'safe',
    steps: [
      { id: 'check-gateway',    label: 'Vérifier passerelle réseau',                                  type: 'check',   connector: null },
      { id: 'scan-devices',     label: 'Scanner appareils réseau local',                              type: 'check',   connector: null },
      { id: 'dlna-full',        label: 'Découverte DLNA complète : renderers, serveurs, players',     type: 'check',   connector: 'dlna' },
      { id: 'dlna-summary',     label: 'Résumé DLNA : appareils, renderers, serveurs, dernière découverte', type: 'suggest', connector: 'dlna' },
      { id: 'check-adb-status',  label: 'Vérifier statut ADB Android (si activé)',                                   type: 'check',   connector: 'adb' },
      { id: 'st-summary',        label: 'SmartThings : statut API, policy exécution, scènes exécutables, dernier audit', type: 'check',   connector: 'smartthings' },
      { id: 'tv-cmd-policy',     label: 'Phase 10 : policy commandes TV, TV allowlistées, dernier audit TV',      type: 'check',   connector: 'smartthings-tv' },
      { id: 'streaming-policy',  label: 'Phase 11 : policy streaming, médiathèque, renderers autorisés, audit streaming', type: 'check',  connector: 'streaming' },
      { id: 'check-services',    label: 'Vérifier services multimédias',                                          type: 'check',   connector: null },
      { id: 'summary',           label: 'Rapport diagnostic complet (réseau + DLNA + Android + SmartThings + TV + Streaming)', type: 'summary', connector: null },
    ],
  },
];

function getAll() {
  return SCENARIOS.map(s => ({
    ...s,
    mode:   'simulated',
    status: 'ready',
  }));
}

function getById(id) {
  const s = SCENARIOS.find(sc => sc.id === id);
  if (!s) return null;
  return { ...s, mode: 'simulated', status: 'ready' };
}

module.exports = { getAll, getById };
