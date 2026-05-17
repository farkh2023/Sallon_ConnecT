'use strict';
/* =============================================
   Sallon-ConnecT — server.js (Phase 22)
   Backend léger : API REST + détection réseau réelle
   Usage : node server.js
============================================= */

const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { exec } = require('child_process');
const dns     = require('dns').promises;

require('dotenv').config({ path: path.join(__dirname, '.env') });

/* Phase 4 — routes multimédias */
const mediaRoutes         = require('./server/src/routes/media');
const integrationRoutes   = require('./server/src/routes/integrations');
/* Phase 5 — orchestrateur de scénarios */
const scenariosRuntime    = require('./server/src/routes/scenariosRuntime');
/* Phase 6 — diagnostic ADB lecture seule */
const adbRoutes           = require('./server/src/routes/adb');
/* Phase 7 — découverte DLNA/UPnP */
const dlnaRoutes          = require('./server/src/routes/dlna');
/* Phase 8 — SmartThings Samsung TV lecture seule */
const smartThingsRoutes   = require('./server/src/routes/smartthings');
/* Phase 11 — Streaming assisté */
const streamingRoutes     = require('./server/src/routes/streaming');
/* Phase 12 — Notifications locales */
const notificationsRoutes = require('./server/src/routes/notifications');
const notifEngine         = require('./server/src/services/notifications/notificationEngine');
/* Phase 13 — Scheduler de tâches planifiées */
const schedulerRoutes     = require('./server/src/routes/scheduler');
/* Phase 18 - Observability locale */
const observabilityRoutes = require('./server/src/routes/observability');
/* Phase 20 - Profils utilisateurs locaux */
const profilesRoutes = require('./server/src/routes/profiles');
/* Phase 21 - Sauvegarde locale sécurisée */
const backupRoutes = require('./server/src/routes/backup');
/* Phase 18B - Seeds tâches planifiées par défaut */
require('./server/src/services/scheduler/schedulerSeeds');

const app  = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const ROOT = __dirname;

/* -----------------------------------------------
   CORS — Phase 14 : autorise le frontend Next.js (localhost:3001)
----------------------------------------------- */
const CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (CORS_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

/* -----------------------------------------------
   STATIC FILES — sert l'interface Phase 2 intacte
----------------------------------------------- */
app.use(express.static(ROOT));
app.use(express.json());

/* -----------------------------------------------
   UTILS — chargement devices.json
----------------------------------------------- */
function loadDevicesConfig() {
  const filePath = path.join(ROOT, 'data', 'devices.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/* -----------------------------------------------
   UTILS — résolution DNS d'un hostname
----------------------------------------------- */
async function resolveHost(host) {
  try {
    const { address } = await dns.lookup(host);
    return address;
  } catch {
    return null;
  }
}

/* -----------------------------------------------
   UTILS — ping (Windows & Unix)
   Retourne true si l'hôte répond, false sinon
----------------------------------------------- */
function pingHost(host) {
  return new Promise(resolve => {
    const isWin = process.platform === 'win32';
    const cmd   = isWin
      ? `ping -n 1 -w 1000 "${host}"`
      : `ping -c 1 -W 1 "${host}"`;

    exec(cmd, { timeout: 4000 }, (err, stdout) => {
      if (err) return resolve(false);
      /* Sur Windows la réponse contient "TTL=" si l'hôte répond */
      const alive = isWin
        ? /TTL=/i.test(stdout)
        : /1 (packets )?received/.test(stdout);
      resolve(alive);
    });
  });
}

/* -----------------------------------------------
   UTILS — vérification d'un appareil
   Convention clé .env : DEVICE_<ID_MAJUSCULE>_HOST
   Exemple : DEVICE_BOX_SFR_FIBRE_HOST=livebox.home
----------------------------------------------- */
async function checkDevice(device) {
  const envKey = `DEVICE_${device.id.toUpperCase().replace(/-/g, '_')}_HOST`;
  const host   = process.env[envKey];

  /* Appareil non configuré dans .env → statut neutre */
  if (!host) {
    return {
      ...device,
      liveStatus:      'unconfigured',
      liveStatusLabel: 'Non configuré',
    };
  }

  const ip    = await resolveHost(host);
  const alive = ip ? await pingHost(ip) : false;

  return {
    ...device,
    status:          alive ? device.status : 'waiting',
    statusLabel:     alive ? device.statusLabel : 'Hors ligne',
    liveStatus:      alive ? 'online' : 'offline',
    liveStatusLabel: alive ? 'En ligne' : 'Hors ligne',
  };
}

/* -----------------------------------------------
   ENDPOINT : GET /api/health
----------------------------------------------- */
app.get('/api/health', (_req, res) => {
  res.json({
    status:    'ok',
    phase:     22,
    server:    'Sallon-ConnecT Hub',
    timestamp: new Date().toISOString(),
  });
});

/* -----------------------------------------------
   ENDPOINT : GET /api/devices
   Lit devices.json, augmente avec statut réseau réel
----------------------------------------------- */
app.get('/api/devices', async (_req, res) => {
  let devices;
  try {
    devices = loadDevicesConfig();
  } catch (err) {
    return res.status(500).json({ error: 'Impossible de lire devices.json', detail: err.message });
  }

  try {
    const results = await Promise.all(devices.map(checkDevice));
    const online  = results.filter(d => d.liveStatus === 'online').length;
    notifEngine.notify({
      type: 'device', level: online > 0 ? 'info' : 'warning',
      title: 'Scan appareils terminé',
      message: `${online}/${results.length} appareil(s) en ligne`,
      meta: { count: results.length, online },
    });
    res.json({
      source:    'live',
      timestamp: new Date().toISOString(),
      count:     results.length,
      devices:   results,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du scan réseau', detail: err.message });
  }
});

/* -----------------------------------------------
   ENDPOINT : GET /api/scan
   Identique à /api/devices — dédié au scan manuel
----------------------------------------------- */
app.get('/api/scan', async (_req, res) => {
  let devices;
  try {
    devices = loadDevicesConfig();
  } catch (err) {
    return res.status(500).json({ error: 'Impossible de lire devices.json', detail: err.message });
  }

  try {
    const results = await Promise.all(devices.map(checkDevice));
    res.json({
      source:    'scan',
      timestamp: new Date().toISOString(),
      count:     results.length,
      devices:   results,
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors du scan réseau', detail: err.message });
  }
});

/* -----------------------------------------------
   ROUTES PHASE 4 — multimédias & intégrations
----------------------------------------------- */
app.use('/api/media',        mediaRoutes);
app.use('/api/integrations', integrationRoutes);

/* -----------------------------------------------
   ROUTES PHASE 5 — orchestrateur de scénarios
----------------------------------------------- */
app.use('/api/scenarios', scenariosRuntime);

/* -----------------------------------------------
   ROUTES PHASE 6 — diagnostic ADB
----------------------------------------------- */
app.use('/api/adb', adbRoutes);

/* -----------------------------------------------
   ROUTES PHASE 7 — découverte DLNA/UPnP
----------------------------------------------- */
app.use('/api/dlna', dlnaRoutes);

/* -----------------------------------------------
   ROUTES PHASE 8 — SmartThings Samsung TV (lecture seule)
----------------------------------------------- */
app.use('/api/smartthings', smartThingsRoutes);

/* -----------------------------------------------
   ROUTES PHASE 11 — Streaming assisté
----------------------------------------------- */
app.use('/api/streaming', streamingRoutes);

/* -----------------------------------------------
   ROUTES PHASE 12 — Notifications locales
----------------------------------------------- */
app.use('/api/notifications', notificationsRoutes);

/* -----------------------------------------------
   ROUTES PHASE 13 — Scheduler
----------------------------------------------- */
app.use('/api/scheduler', schedulerRoutes);

/* -----------------------------------------------
   ROUTES PHASE 18 - Observability locale
----------------------------------------------- */
app.use('/api/observability', observabilityRoutes);

/* -----------------------------------------------
   ROUTES PHASE 20 - Profils utilisateurs locaux
----------------------------------------------- */
app.use('/api/profiles', profilesRoutes);

/* -----------------------------------------------
   ROUTES PHASE 21 - Sauvegarde locale sécurisée
----------------------------------------------- */
app.use('/api/backup', backupRoutes);

/* -----------------------------------------------
   FALLBACK — toute route non-API renvoie index.html
----------------------------------------------- */
app.get('*', (_req, res) => {
  res.sendFile(path.join(ROOT, 'index.html'));
});

/* -----------------------------------------------
   DÉMARRAGE
----------------------------------------------- */
function startServer() {
  return app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║   Sallon-ConnecT Hub — Phase 22      ║');
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
  console.log(`  Interface : http://localhost:${PORT}`);
  console.log(`  Appareils : http://localhost:${PORT}/api/devices`);
  console.log(`  Scan      : http://localhost:${PORT}/api/scan`);
  console.log(`  Santé     : http://localhost:${PORT}/api/health`);
  console.log(`  Médias    : http://localhost:${PORT}/api/media/services`);
  console.log(`  Statut    : http://localhost:${PORT}/api/media/status`);
  console.log(`  Intégrat. : http://localhost:${PORT}/api/integrations/status`);
  console.log(`  Scénarios : http://localhost:${PORT}/api/scenarios/runtime`);
  console.log(`  Historique: http://localhost:${PORT}/api/scenarios/history`);
  console.log(`  ADB statut: http://localhost:${PORT}/api/adb/status`);
  console.log(`  ADB diagno: http://localhost:${PORT}/api/adb/diagnostics`);
  console.log(`  DLNA statut: http://localhost:${PORT}/api/dlna/status`);
  console.log(`  DLNA disco.: http://localhost:${PORT}/api/dlna/devices`);
  console.log(`  SmartThings: http://localhost:${PORT}/api/smartthings/status`);
  console.log(`  ST sécurité: http://localhost:${PORT}/api/smartthings/safety`);
  console.log(`  Streaming  : http://localhost:${PORT}/api/streaming/policy`);
  console.log(`  Médiathèque: http://localhost:${PORT}/api/streaming/library/status`);
  console.log(`  File lecture: http://localhost:${PORT}/api/streaming/queue`);
  console.log(`  Notifs     : http://localhost:${PORT}/api/notifications`);
  console.log(`  Notifs stats: http://localhost:${PORT}/api/notifications/stats`);
  console.log(`  Scheduler  : http://localhost:${PORT}/api/scheduler/status`);
  console.log(`  Observab.  : http://localhost:${PORT}/api/observability/overview`);
  console.log(`  Tâches     : http://localhost:${PORT}/api/scheduler/schedules`);
  console.log('');

  /* Notification de démarrage */
  notifEngine.notify({
    type: 'system', level: 'success',
    title: 'Serveur démarré',
    message: `Sallon-ConnecT Phase 22 - port ${PORT}`,
    meta: { phase: 22, port: PORT },
  });
  console.log('  Copier .env.example → .env pour configurer les connecteurs');
  console.log('');
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
