'use strict';
/* =============================================
   dlnaConnector.js — Phase 7 + Phase 11
   Phase 7 : découverte DLNA/UPnP (lecture seule, aucune action SOAP)
   Phase 11 : streaming assisté — validations + audit, mode assisté uniquement
============================================= */

const dgram    = require('dgram');
const http     = require('http');
const fs       = require('fs');
const path     = require('path');
const config   = require('../config');
const safety   = require('./dlnaSafety');
const stSafety = require('./streamingSafety');
const library  = require('./localMediaLibrary');

/* ── Types de recherche SSDP ───────────────── */
const ST_ALL        = 'ssdp:all';
const ST_ROOT       = 'upnp:rootdevice';
const ST_RENDERER   = 'urn:schemas-upnp-org:device:MediaRenderer:1';
const ST_SERVER     = 'urn:schemas-upnp-org:device:MediaServer:1';
const ST_PLAYER     = 'urn:schemas-upnp-org:device:MediaPlayer:1';

/* ── Cache de découverte en mémoire ─────────── */
let _discoveryCache = {
  devices:   [],
  renderers: [],
  servers:   [],
  players:   [],
  lastAt:    null,
};

/* ── Helpers config ────────────────────────── */
function cfg() {
  return config.dlna;
}
function isMasking() {
  return cfg().maskLocalIps !== false;
}

/* ── Fetch XML description (optionnel) ─────── */
function fetchDescription(locationUrl) {
  return new Promise(resolve => {
    if (!cfg().fetchDescriptions) return resolve(null);

    try {
      const u = new URL(locationUrl);
      if (!safety.isLocalAddress(u.hostname)) return resolve(null);

      const req = http.get(locationUrl, { timeout: 2000 }, res => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { body += chunk; if (body.length > 8000) { req.destroy(); } });
        res.on('end', () => resolve(safety.sanitizeDeviceDescription(body)));
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
    } catch {
      resolve(null);
    }
  });
}

/* ── Découverte SSDP générique ─────────────── */
function ssdpSearch(searchTarget) {
  return new Promise(resolve => {
    if (!cfg().enabled) return resolve([]);

    const mcastAddr = cfg().multicastAddress;
    const mcastPort = cfg().multicastPort;
    const timeout   = cfg().discoveryTimeout;
    const maxResp   = cfg().maxResponses;
    const maskIp    = isMasking();

    const seen    = new Set();
    const results = [];

    let socket;
    try {
      socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    } catch (e) {
      return resolve([]);
    }

    const done = () => {
      try { socket.close(); } catch { /* déjà fermé */ }
      resolve(results);
    };

    const timer = setTimeout(done, timeout);

    socket.on('error', () => { clearTimeout(timer); resolve(results); });

    socket.on('message', async (msg, rinfo) => {
      /* Accepter uniquement les réponses locales */
      if (!safety.isLocalAddress(rinfo.address)) return;
      if (results.length >= maxResp) return;

      const parsed = safety.sanitizeSsdpResponse(msg.toString(), maskIp);
      if (!parsed.usn || seen.has(parsed.usn)) return;
      seen.add(parsed.usn);

      const entry = {
        ip:       maskIp ? safety.maskLocalIp(rinfo.address) : rinfo.address,
        st:       parsed.st       || searchTarget,
        usn:      parsed.usn,
        server:   parsed.server   || null,
        location: parsed.location || null,
        masked:   maskIp,
      };

      /* Fetch description XML si activé */
      if (parsed.location && cfg().fetchDescriptions) {
        const desc = await fetchDescription(parsed.location);
        if (desc) Object.assign(entry, { description: desc });
      }

      results.push(entry);
    });

    const msg = Buffer.from(
      `M-SEARCH * HTTP/1.1\r\n` +
      `HOST: ${mcastAddr}:${mcastPort}\r\n` +
      `MAN: "ssdp:discover"\r\n` +
      `MX: 2\r\n` +
      `ST: ${searchTarget}\r\n` +
      `\r\n`
    );

    socket.bind(() => {
      try {
        socket.send(msg, 0, msg.length, mcastPort, mcastAddr);
      } catch {
        clearTimeout(timer);
        resolve(results);
      }
    });
  });
}

/* ── Déduplication par USN ─────────────────── */
function deduplicate(lists) {
  const seen = new Set();
  const out  = [];
  for (const list of lists) {
    for (const d of list) {
      if (!seen.has(d.usn)) { seen.add(d.usn); out.push(d); }
    }
  }
  return out;
}

/* ── API publique ──────────────────────────── */

function getStatus() {
  if (!cfg().enabled) return { status: 'disabled', readOnly: true, available: false };
  return {
    status:    _discoveryCache.lastAt ? 'available' : 'ready',
    readOnly:  true,
    available: _discoveryCache.devices.length > 0,
    deviceCount:   _discoveryCache.devices.length,
    rendererCount: _discoveryCache.renderers.length,
    serverCount:   _discoveryCache.servers.length,
    playerCount:   _discoveryCache.players.length,
    lastDiscoveryAt: _discoveryCache.lastAt,
  };
}

function getCapabilities() {
  if (!cfg().enabled) return [];
  return ['discover-devices', 'discover-renderers', 'discover-servers', 'discover-players', 'read-descriptions'];
}

async function discoverDevices() {
  if (!cfg().enabled) {
    return { status: 'disabled', message: 'DLNA désactivé. Activez DLNA_ENABLED=true dans .env', devices: [] };
  }

  try {
    /* Recherches parallèles sur plusieurs ST */
    const [all, renderers, servers, players] = await Promise.all([
      ssdpSearch(ST_ROOT),
      ssdpSearch(ST_RENDERER),
      ssdpSearch(ST_SERVER),
      ssdpSearch(ST_PLAYER),
    ]);

    const allDevices = deduplicate([all, renderers, servers, players]);

    _discoveryCache = {
      devices:   allDevices,
      renderers: renderers.length ? renderers : allDevices.filter(d => d.st && d.st.includes('MediaRenderer')),
      servers:   servers.length   ? servers   : allDevices.filter(d => d.st && d.st.includes('MediaServer')),
      players:   players.length   ? players   : allDevices.filter(d => d.st && d.st.includes('MediaPlayer')),
      lastAt:    new Date().toISOString(),
    };

    const status = allDevices.length > 0 ? 'available' : 'no_device';
    return {
      status,
      readOnly:       true,
      masked:         isMasking(),
      devices:        allDevices,
      count:          allDevices.length,
      rendererCount:  _discoveryCache.renderers.length,
      serverCount:    _discoveryCache.servers.length,
      playerCount:    _discoveryCache.players.length,
      discoveredAt:   _discoveryCache.lastAt,
      note:           'Découverte locale uniquement — aucune action de contrôle.',
    };
  } catch (err) {
    return { status: 'error', message: safety.buildSafeDlnaError(err).message, devices: [] };
  }
}

async function discoverRenderers() {
  if (!cfg().enabled) return { status: 'disabled', renderers: [] };
  try {
    const results = await ssdpSearch(ST_RENDERER);
    return { status: results.length ? 'available' : 'no_device', renderers: results, count: results.length };
  } catch (err) {
    return { status: 'error', message: safety.buildSafeDlnaError(err).message, renderers: [] };
  }
}

async function discoverMediaServers() {
  if (!cfg().enabled) return { status: 'disabled', servers: [] };
  try {
    const results = await ssdpSearch(ST_SERVER);
    return { status: results.length ? 'available' : 'no_device', servers: results, count: results.length };
  } catch (err) {
    return { status: 'error', message: safety.buildSafeDlnaError(err).message, servers: [] };
  }
}

async function discoverPlayers() {
  if (!cfg().enabled) return { status: 'disabled', players: [] };
  try {
    const results = await ssdpSearch(ST_PLAYER);
    return { status: results.length ? 'available' : 'no_device', players: results, count: results.length };
  } catch (err) {
    return { status: 'error', message: safety.buildSafeDlnaError(err).message, players: [] };
  }
}

async function getSafeDiagnostics() {
  if (!cfg().enabled) {
    return { status: 'disabled', readOnly: true, message: 'DLNA désactivé. Activez DLNA_ENABLED=true dans .env' };
  }
  const discovery = await discoverDevices();
  return {
    ...discovery,
    readOnly:  true,
    masked:    isMasking(),
    safetyNote: 'Aucune action SOAP, aucun envoi de média, aucun contrôle TV.',
  };
}

function getLastDiscovery() {
  if (!_discoveryCache.lastAt) {
    if (!cfg().enabled) return { status: 'disabled', devices: [] };
    return { status: 'no_cache', message: 'Aucune découverte effectuée. Appelez POST /api/dlna/discover.', devices: [] };
  }
  return {
    status:         _discoveryCache.devices.length > 0 ? 'available' : 'no_device',
    readOnly:        true,
    masked:          isMasking(),
    devices:         _discoveryCache.devices,
    renderers:       _discoveryCache.renderers,
    servers:         _discoveryCache.servers,
    players:         _discoveryCache.players,
    count:           _discoveryCache.devices.length,
    lastDiscoveryAt: _discoveryCache.lastAt,
  };
}

function clearDiscoveryCache() {
  _discoveryCache = { devices: [], renderers: [], servers: [], players: [], lastAt: null };
}

/* ── runPreview() — compatible Phase 4/5 ─── */
function runPreview() {
  if (!cfg().enabled) {
    return {
      status:  'disabled',
      message: 'DLNA désactivé. Pour activer : DLNA_ENABLED=true dans .env',
      howTo:   'Utilise le module dgram natif Node.js — aucune dépendance npm requise.',
    };
  }
  return { status: 'ready', message: 'DLNA actif — découverte locale disponible.' };
}

/* =============================================
   Phase 11 — Streaming assisté
============================================= */

const STREAMING_AUDIT_PATH = path.resolve(
  config.streaming && config.streaming.auditPath
    ? config.streaming.auditPath
    : 'runtime/media-streaming-audit.json'
);

function _readStreamingAudit() {
  try {
    const raw  = fs.readFileSync(STREAMING_AUDIT_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data.entries) ? data.entries : [];
  } catch {
    return [];
  }
}

function _writeStreamingAudit(entries) {
  try {
    fs.writeFileSync(
      STREAMING_AUDIT_PATH,
      JSON.stringify({ entries, lastUpdatedAt: new Date().toISOString() }, null, 2),
      'utf8'
    );
  } catch { /* Silencieux */ }
}

function _appendStreamingAudit(entry) {
  const entries = _readStreamingAudit();
  entries.unshift(entry);
  _writeStreamingAudit(entries.slice(0, 200));
}

/* ── getStreamingPolicy ───────────────────── */
function getStreamingPolicy() {
  const cfg    = config.streaming;
  const dlnaCfg = config.dlna;

  if (!cfg || !cfg.enabled) {
    return {
      status:  'disabled',
      message: 'Streaming désactivé (MEDIA_STREAMING_ENABLED=false)',
      streaming: { enabled: false },
    };
  }

  const allowlist = ((dlnaCfg && dlnaCfg.rendererAllowlist) || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  return {
    status:              'enabled',
    streaming: {
      enabled:             true,
      requireConfirmation: cfg.requireConfirmation,
      allowedExtensions:   (cfg.allowedExtensions || '').split(',').map(e => e.trim()),
      maxFileMb:           cfg.maxFileMb,
      auditEnabled:        cfg.auditEnabled,
      maskPaths:           cfg.maskPaths,
    },
    dlna: {
      streamingEnabled:         dlnaCfg && dlnaCfg.streamingEnabled,
      rendererAllowlistCount:   allowlist.length,
      rendererAllowlistEmpty:   allowlist.length === 0,
      blockAutoplayInScenarios: dlnaCfg && dlnaCfg.blockAutoplayInScenarios,
    },
    securityNote: 'Aucun média ne sera envoyé sans confirmation explicite et renderer dans la liste autorisée.',
  };
}

/* ── getAllowedRenderers ───────────────────── */
function getAllowedRenderers() {
  const dlnaCfg  = config.dlna;
  const strmCfg  = config.streaming;

  if (!strmCfg || !strmCfg.enabled) {
    return { status: 'disabled', renderers: [], message: 'Streaming désactivé.' };
  }
  if (!dlnaCfg || !dlnaCfg.streamingEnabled) {
    return { status: 'disabled', renderers: [], message: 'DLNA streaming désactivé (DLNA_STREAMING_ENABLED=false).' };
  }

  const allowlist = ((dlnaCfg.rendererAllowlist) || '')
    .split(',').map(s => s.trim()).filter(Boolean);

  if (allowlist.length === 0) {
    return {
      status:   'empty_allowlist',
      renderers: [],
      message:  'Aucun renderer autorisé. Configurez DLNA_RENDERER_ALLOWLIST dans .env.',
    };
  }

  /* Croiser avec les renderers découverts (si cache disponible) */
  const discovered = _discoveryCache.renderers || [];
  const renderers  = allowlist.map((rid, idx) => {
    const found = discovered.find(r => r.usn && r.usn.includes(rid));
    return {
      rendererId:       stSafety.maskRendererId(rid),
      rendererIdRaw:    rid,
      name:             found ? (found.server || `Renderer-${idx + 1}`) : `Renderer-${idx + 1}`,
      discoveryStatus:  found ? 'discovered' : 'not_yet_discovered',
      allowed:          true,
    };
  });

  return {
    status:    'ok',
    renderers,
    count:     renderers.length,
    note:      'Redécouvrez les appareils pour mettre à jour le statut de découverte.',
  };
}

/* ── previewStreamToRenderer ──────────────── */
function previewStreamToRenderer(mediaId, rendererId) {
  const strmCfg = config.streaming;
  const dlnaCfg = config.dlna;

  if (!strmCfg || !strmCfg.enabled) {
    return { valid: false, reason: 'Streaming désactivé.' };
  }
  if (!dlnaCfg || !dlnaCfg.streamingEnabled) {
    return { valid: false, reason: 'DLNA streaming désactivé.' };
  }

  /* Valider le renderer */
  const rendererCheck = stSafety.validateRendererAllowed(rendererId, config);
  if (!rendererCheck.valid) {
    return { valid: false, reason: rendererCheck.reason };
  }

  /* Valider le média */
  const mediaItem = library.getMediaItemById(mediaId);
  if (!mediaItem) {
    return { valid: false, reason: 'Média introuvable. Scannez d\'abord la médiathèque.' };
  }

  const fileCheck = stSafety.validateMediaFilePath(mediaItem._absolutePath, config);
  if (!fileCheck.valid) {
    return { valid: false, reason: fileCheck.reason };
  }

  return {
    valid:          true,
    mediaId:        mediaItem.id,
    title:          mediaItem.title,
    type:           mediaItem.type,
    extension:      mediaItem.extension,
    sizeMb:         mediaItem.sizeMb,
    rendererMasked: stSafety.maskRendererId(rendererId),
    requiresConfirmation: strmCfg.requireConfirmation,
    confirmationCode: strmCfg.requireConfirmation ? strmCfg.confirmationCode : null,
    warning:        'Ce média sera lu sur le renderer sélectionné après confirmation.',
    filePathExposed: false,
  };
}

/* ── streamToRenderer (mode assisté) ─────── */
function streamToRenderer(mediaId, rendererId, options = {}) {
  const strmCfg = config.streaming;
  const dlnaCfg = config.dlna;
  const auditId = `sa-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const requestedAt = new Date().toISOString();

  const base = { auditId, mediaId, rendererId: stSafety.maskRendererId(rendererId), requestedAt };

  /* Guard 1 — Streaming global activé */
  if (!strmCfg || !strmCfg.enabled) {
    return { ...base, status: 'blocked', reason: 'Streaming désactivé.' };
  }

  /* Guard 2 — DLNA streaming activé */
  if (!dlnaCfg || !dlnaCfg.streamingEnabled) {
    return { ...base, status: 'blocked', reason: 'DLNA streaming désactivé.' };
  }

  /* Guard 3 — Renderer allowlist */
  const rendererCheck = stSafety.validateRendererAllowed(rendererId, config);
  if (!rendererCheck.valid) {
    const entry = stSafety.buildStreamingAuditEntry({
      auditId, mediaId, rendererId, requestedAt,
      status: 'blocked', reason: rendererCheck.reason,
      rendererAllowed: false,
    });
    if (strmCfg.auditEnabled) _appendStreamingAudit(entry);
    return { ...base, status: 'blocked', reason: rendererCheck.reason };
  }

  /* Guard 4 — Média dans la bibliothèque + chemin valide */
  const mediaItem = library.getMediaItemById(mediaId);
  if (!mediaItem) {
    const entry = stSafety.buildStreamingAuditEntry({
      auditId, mediaId, rendererId, requestedAt,
      status: 'blocked', reason: 'Média introuvable.',
    });
    if (strmCfg.auditEnabled) _appendStreamingAudit(entry);
    return { ...base, status: 'blocked', reason: 'Média introuvable. Scannez la médiathèque.' };
  }

  const fileCheck = stSafety.validateMediaFilePath(mediaItem._absolutePath, config);
  if (!fileCheck.valid) {
    const entry = stSafety.buildStreamingAuditEntry({
      auditId, mediaId: mediaItem.id, mediaTitle: mediaItem.title,
      mediaType: mediaItem.type, rendererId, requestedAt,
      status: 'blocked', reason: fileCheck.reason,
    });
    if (strmCfg.auditEnabled) _appendStreamingAudit(entry);
    return { ...base, status: 'blocked', reason: fileCheck.reason };
  }

  /* Guard 5 — Confirmation */
  const confirmCheck = stSafety.validateStreamingConfirmation(options.confirmation, config);
  if (!confirmCheck.valid) {
    const entry = stSafety.buildStreamingAuditEntry({
      auditId, mediaId: mediaItem.id, mediaTitle: mediaItem.title,
      mediaType: mediaItem.type, rendererId, requestedAt,
      status: 'blocked', reason: confirmCheck.reason,
      confirmationUsed: false,
    });
    if (strmCfg.auditEnabled) _appendStreamingAudit(entry);
    return { ...base, status: 'blocked', reason: confirmCheck.reason };
  }

  /* Toutes les validations passées — mode assisté */
  const executedAt = new Date().toISOString();
  const auditEntry = stSafety.buildStreamingAuditEntry({
    auditId,
    mediaId:         mediaItem.id,
    mediaTitle:      mediaItem.title,
    mediaType:       mediaItem.type,
    rendererId,
    rendererName:    options.rendererName || 'Renderer',
    requestedAt,
    executedAt,
    mode:            'assisted',
    status:          'instructed',
    confirmationUsed: true,
    rendererAllowed:  true,
  });

  if (strmCfg.auditEnabled) _appendStreamingAudit(auditEntry);

  return {
    ...base,
    status:          'instructed',
    mode:            'assisted',
    executedAt,
    media: {
      id:        mediaItem.id,
      title:     mediaItem.title,
      type:      mediaItem.type,
      extension: mediaItem.extension,
      sizeMb:    mediaItem.sizeMb,
    },
    rendererMasked:  stSafety.maskRendererId(rendererId),
    instructions: [
      `Sur votre renderer, accédez à la bibliothèque DLNA/UPnP de votre réseau.`,
      `Recherchez "Sallon-ConnecT" dans les serveurs média disponibles.`,
      `Sélectionnez le fichier : "${mediaItem.title}${mediaItem.extension}"`,
      `Appuyez sur Lecture.`,
    ],
    note:            'Streaming assisté — aucune action SOAP automatique. L\'utilisateur contrôle la lecture.',
    auditId,
    filePathExposed: false,
  };
}

/* ── stopRendererPlayback (mode assisté) ─── */
function stopRendererPlayback(rendererId, options = {}) {
  const strmCfg = config.streaming;
  const dlnaCfg = config.dlna;
  const auditId = `sa-stop-${Date.now().toString(36)}`;

  if (!strmCfg || !strmCfg.enabled) {
    return { status: 'blocked', reason: 'Streaming désactivé.' };
  }
  if (!dlnaCfg || !dlnaCfg.streamingEnabled) {
    return { status: 'blocked', reason: 'DLNA streaming désactivé.' };
  }

  const rendererCheck = stSafety.validateRendererAllowed(rendererId, config);
  if (!rendererCheck.valid) {
    return { status: 'blocked', reason: rendererCheck.reason, auditId };
  }

  const confirmCheck = stSafety.validateStreamingConfirmation(options.confirmation, config);
  if (!confirmCheck.valid) {
    return { status: 'blocked', reason: confirmCheck.reason, auditId };
  }

  return {
    status:         'instructed',
    mode:           'assisted',
    auditId,
    rendererMasked: stSafety.maskRendererId(rendererId),
    instructions:   ['Sur votre renderer, appuyez sur Arrêt ou fermez la lecture en cours.'],
    note:           'Arrêt assisté — aucune commande SOAP envoyée automatiquement.',
  };
}

/* ── getStreamingAuditHistory ─────────────── */
function getStreamingAuditHistory() {
  const entries = _readStreamingAudit();
  return {
    status:  'ok',
    count:   entries.length,
    entries,
  };
}

/* ── clearStreamingAuditHistory ───────────── */
function clearStreamingAuditHistory() {
  _writeStreamingAudit([]);
  return { status: 'cleared', message: 'Historique streaming vidé.' };
}

module.exports = {
  getStatus,
  getCapabilities,
  discoverDevices,
  discoverRenderers,
  discoverMediaServers,
  discoverPlayers,
  getSafeDiagnostics,
  getLastDiscovery,
  clearDiscoveryCache,
  runPreview,
  /* Phase 11 */
  getStreamingPolicy,
  getAllowedRenderers,
  previewStreamToRenderer,
  streamToRenderer,
  stopRendererPlayback,
  getStreamingAuditHistory,
  clearStreamingAuditHistory,
};
