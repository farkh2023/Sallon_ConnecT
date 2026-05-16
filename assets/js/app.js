/* =============================================
   Sallon-ConnecT — app.js (Phase 5)
   Backend-first + Centre multimédia + Orchestrateur scénarios
============================================= */

/* -----------------------------------------------
   STATE
----------------------------------------------- */
let DEVICES        = [];
let AGENTS         = [];
let MEDIA_SERVICES = [];
let SCENARIOS      = [];

let agentStates    = {};   // { agentId: 'ready' | 'running' | 'done' }
let activeScenario = null;
let currentFilter  = 'all';

let DATA_SOURCE    = 'simulated';  // 'live' | 'simulated'
let _refreshTimer  = null;

/* Phase 4 — état du centre multimédia */
let MEDIA_SERVICES_DATA = [];
let MEDIA_STATUS        = {};
let MEDIA_PLAYLISTS     = [];

/* Phase 5 — état de l'orchestrateur de scénarios */
let SCENARIO_RUNTIME   = null;   // données du moteur
let SCENARIO_HISTORY   = [];

/* Phase 6 — état diagnostic ADB */
let ADB_STATUS         = null;
let ADB_DIAGNOSTICS    = null;

/* Phase 7 — état découverte DLNA */
let DLNA_STATUS        = null;
let DLNA_DEVICES       = null;

/* Phase 8 — état SmartThings Samsung TV */
let SMARTTHINGS_STATUS  = null;
let SMARTTHINGS_DEVICES = null;
let SMARTTHINGS_SCENES  = null;

/* Phase 9 — exécution de scènes SmartThings */
let ST_EXECUTION_POLICY   = null;
let ST_EXECUTABLE_SCENES  = null;
let ST_AUDIT              = null;
let ST_PENDING_SCENE_ID   = null;

/* Phase 10 — commandes TV contrôlées */
let TV_CMD_POLICY         = null;
let TV_ALLOWED_DEVICES    = null;
let TV_AUDIT              = null;
let TV_CURRENT_DEVICE_ID  = null;  // ID original (non masqué) de la TV sélectionnée

const LIVE_REFRESH_MS  = 15000;  // intervalle de rafraîchissement en mode live
const BACKEND_TIMEOUT  = 3000;   // timeout fetch backend (ms)

/* -----------------------------------------------
   DATA LOADING
   1. Tente /api/devices (backend Phase 3)
   2. Fallback : data/devices.json (Phase 2)
   Agents / services / scénarios : toujours depuis JSON
----------------------------------------------- */
async function loadData() {
  /* Chargement statique en parallèle */
  const [agents, services, scenarios] = await Promise.all([
    fetch('data/agents.json').then(r => r.json()),
    fetch('data/services.json').then(r => r.json()),
    fetch('data/scenarios.json').then(r => r.json()),
  ]);
  AGENTS         = agents;
  MEDIA_SERVICES = services;
  SCENARIOS      = scenarios;

  /* Tentative backend avec timeout */
  try {
    const ac  = new AbortController();
    const tid = setTimeout(() => ac.abort(), BACKEND_TIMEOUT);
    const res = await fetch('/api/devices', { signal: ac.signal });
    clearTimeout(tid);

    if (res.ok) {
      const payload = await res.json();
      DEVICES     = payload.devices;
      DATA_SOURCE = 'live';
      return;
    }
  } catch { /* backend absent ou timeout → fallback */ }

  /* Fallback JSON statique */
  DEVICES     = await fetch('data/devices.json').then(r => r.json());
  DATA_SOURCE = 'simulated';
}

/* -----------------------------------------------
   LIVE REFRESH — rafraîchit les appareils toutes les 15 s
----------------------------------------------- */
function startLiveRefresh() {
  stopLiveRefresh();
  _refreshTimer = setInterval(refreshDevices, LIVE_REFRESH_MS);
}

function stopLiveRefresh() {
  if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
}

async function refreshDevices() {
  try {
    const ac  = new AbortController();
    const tid = setTimeout(() => ac.abort(), BACKEND_TIMEOUT + 1000);
    const res = await fetch('/api/devices', { signal: ac.signal });
    clearTimeout(tid);
    if (!res.ok) return;
    const payload = await res.json();
    DEVICES = payload.devices;
    renderDevices();
    updateHeroStats();
  } catch { /* erreur silencieuse entre deux rafraîchissements */ }
}

/* -----------------------------------------------
   SCAN MANUEL — déclenché par le bouton scan
----------------------------------------------- */
async function triggerScan() {
  const btn = document.getElementById('scanBtn');
  if (btn) { btn.disabled = true; btn.textContent = '⟳ Scan en cours…'; }

  try {
    const ac  = new AbortController();
    const tid = setTimeout(() => ac.abort(), 8000);
    const res = await fetch('/api/scan', { signal: ac.signal });
    clearTimeout(tid);
    if (res.ok) {
      const payload = await res.json();
      DEVICES = payload.devices;
      renderDevices();
      updateHeroStats();
    }
  } catch { /* timeout ou backend arrêté */ } finally {
    if (btn) { btn.disabled = false; btn.textContent = '⟳ Scanner le réseau'; }
  }
}

/* -----------------------------------------------
   UI — BADGE SOURCE (nav)
   Injecte/met à jour le badge "En direct" / "Simulé"
----------------------------------------------- */
function updateSourceBadge() {
  let badge = document.getElementById('sourceBadge');
  if (!badge) {
    badge = document.createElement('span');
    badge.id = 'sourceBadge';
    const logo = document.querySelector('.nav-logo');
    if (logo) logo.insertAdjacentElement('afterend', badge);
  }
  badge.className = `source-badge ${DATA_SOURCE}`;
  badge.textContent = DATA_SOURCE === 'live' ? '⬤ En direct' : '◎ Simulé';
}

/* -----------------------------------------------
   UI — BOUTON SCAN (section appareils, live uniquement)
----------------------------------------------- */
function updateScanButton() {
  const existing = document.getElementById('scanBtn');
  if (DATA_SOURCE !== 'live') { if (existing) existing.remove(); return; }
  if (existing) return; /* déjà présent */
  const btn = document.createElement('button');
  btn.id        = 'scanBtn';
  btn.className = 'btn-scan';
  btn.textContent = '⟳ Scanner le réseau';
  btn.onclick   = triggerScan;
  const filters = document.querySelector('.device-filters');
  if (filters) filters.appendChild(btn);
}

/* -----------------------------------------------
   RENDER — HERO STATS
----------------------------------------------- */
function updateHeroStats() {
  const d = document.getElementById('statDevices');
  const a = document.getElementById('statAgents');
  const s = document.getElementById('statScenarios');
  if (d) d.textContent = DEVICES.length;
  if (a) a.textContent = AGENTS.length;
  if (s) s.textContent = SCENARIOS.length;
}

/* -----------------------------------------------
   RENDER — DEVICES
----------------------------------------------- */
function renderDevices(filter = currentFilter) {
  currentFilter = filter;
  const grid     = document.getElementById('devicesGrid');
  const filtered = filter === 'all' ? DEVICES : DEVICES.filter(d => d.category === filter);

  if (!filtered.length) {
    grid.innerHTML = '<p class="loading-placeholder">Aucun appareil dans cette catégorie.</p>';
    return;
  }

  grid.innerHTML = filtered.map(d => {
    /* En mode live, liveStatus peut surcharger status pour l'apparence */
    const displayStatus = d.liveStatus === 'offline' ? 'waiting' : d.status;
    const displayLabel  = d.liveStatusLabel || d.statusLabel;
    return `
      <div class="card device-card" data-category="${d.category}">
        <div class="device-icon">${d.icon}</div>
        <div class="device-name">${d.name}</div>
        <div class="device-type">${d.type}</div>
        <div class="device-role">${d.role}</div>
        <div class="device-footer">
          <span class="status-${displayStatus}">
            <span class="status-dot"></span>
            <span class="status-text">${displayLabel}</span>
          </span>
          <button class="btn-sm" onclick="openModal('${d.id}')">Voir détails</button>
        </div>
      </div>
    `;
  }).join('');
}

function filterDevices(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDevices(cat);
}

/* -----------------------------------------------
   MODAL — DEVICE DETAIL
----------------------------------------------- */
function openModal(deviceId) {
  const d = DEVICES.find(x => x.id === deviceId);
  if (!d) return;

  const rows = Object.entries(d.details).map(([k, v]) =>
    `<div class="modal-row"><span class="modal-label">${k}</span><span class="modal-val">${v}</span></div>`
  ).join('');

  /* Ajout de la ligne statut live si disponible */
  const liveRow = d.liveStatus ? `
    <div class="modal-row">
      <span class="modal-label">Statut réseau</span>
      <span class="modal-val">${d.liveStatusLabel || d.liveStatus}</span>
    </div>` : '';

  document.getElementById('modalContent').innerHTML = `
    <div style="font-size:2.4rem;margin-bottom:12px">${d.icon}</div>
    <div class="modal-title">${d.name}</div>
    <p class="modal-body" style="margin-bottom:16px">${d.role}</p>
    ${rows}${liveRow}
  `;
  document.getElementById('deviceModal').classList.add('open');
}

function closeModal() {
  document.getElementById('deviceModal').classList.remove('open');
}

/* -----------------------------------------------
   RENDER — AGENTS
----------------------------------------------- */
function renderAgents() {
  const grid  = document.getElementById('agentsGrid');
  const labels = { ready: '⚪ Prêt', running: '🔄 En cours…', done: '✅ Terminé' };

  grid.innerHTML = AGENTS.map(a => {
    const state    = agentStates[a.id] || 'ready';
    const disabled = state === 'running' || state === 'done' ? 'disabled' : '';
    const btnLabel = state === 'done' ? '✓ Exécuté' : "▶ Exécuter l'agent";
    return `
      <div class="card agent-card" id="card_${a.id}">
        <div class="agent-icon">${a.icon}</div>
        <div class="agent-name">${a.name}</div>
        <span class="agent-status-badge ${state}">${labels[state]}</span>
        <div class="agent-mission">${a.mission}</div>
        <button class="btn-exec" id="btn_${a.id}" onclick="execAgent('${a.id}')" ${disabled}>
          ${btnLabel}
        </button>
        <div class="agent-output ${state === 'done' ? 'visible' : ''}" id="out_${a.id}">
          ${a.output}
        </div>
      </div>
    `;
  }).join('');

  updateProgress();
}

/* -----------------------------------------------
   AGENT EXECUTION
----------------------------------------------- */
function execAgent(id) {
  return new Promise(resolve => {
    agentStates[id] = 'running';
    renderAgents();
    setTimeout(() => {
      agentStates[id] = 'done';
      renderAgents();
      checkFusion();
      resolve();
    }, 1400 + Math.random() * 600);
  });
}

async function launchAllAgents() {
  for (const a of AGENTS) {
    if (agentStates[a.id] !== 'done') await execAgent(a.id);
  }
}

function resetAgents() {
  agentStates    = {};
  activeScenario = null;
  renderAgents();
  renderScenarios();
  document.getElementById('fusionBox').classList.remove('visible');
  document.getElementById('fusionPending').style.display = 'block';
}

/* -----------------------------------------------
   PROGRESS BAR
----------------------------------------------- */
function updateProgress() {
  const done = AGENTS.filter(a => agentStates[a.id] === 'done').length;
  const pct  = AGENTS.length ? Math.round((done / AGENTS.length) * 100) : 0;
  document.getElementById('progressBar').style.width      = pct + '%';
  document.getElementById('progressPct').textContent      = pct + '%';
  document.getElementById('agentCountLabel').textContent  =
    `${done} / ${AGENTS.length} agents terminés`;
}

/* -----------------------------------------------
   FUSION — SYNTHÈSE FINALE
----------------------------------------------- */
function checkFusion() {
  const allDone = AGENTS.length > 0 && AGENTS.every(a => agentStates[a.id] === 'done');
  document.getElementById('fusionPending').style.display = allDone ? 'none' : 'block';
  const box = document.getElementById('fusionBox');
  if (!allDone) { box.classList.remove('visible'); return; }
  renderFusion();
  box.classList.add('visible');
  box.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderFusion() {
  const tvDevice      = DEVICES.find(d => d.category === 'tv');
  const networkDevice = DEVICES.find(d => d.category === 'reseau');
  const onlineCount   = DEVICES.filter(d => d.liveStatus === 'online').length;
  const sourceLabel   = DATA_SOURCE === 'live'
    ? `En direct (${onlineCount} en ligne)`
    : 'Simulé (données statiques)';

  const items = [
    { label: 'Appareils détectés',  val: `${DEVICES.length} appareils` },
    { label: 'Écran principal',      val: tvDevice ? tvDevice.name : 'Non défini' },
    { label: 'Services multimédias', val: `${MEDIA_SERVICES.length} services disponibles` },
    { label: 'Scénarios configurés', val: `${SCENARIOS.length} scénarios prêts` },
    { label: 'Agents exécutés',      val: `${AGENTS.length} / ${AGENTS.length} terminés` },
    { label: 'Source des données',   val: sourceLabel },
    { label: 'Réseau',               val: networkDevice ? `${networkDevice.name} OK` : 'Non défini' },
  ];

  document.getElementById('fusionGrid').innerHTML = items.map(i => `
    <div class="fusion-item">
      <div class="fusion-item-label">${i.label}</div>
      <div class="fusion-item-val">${i.val}</div>
    </div>
  `).join('');

  document.getElementById('fusionNext').innerHTML = `
    <p>
      <strong>Prochaine étape recommandée (Phase 4) :</strong><br>
      Intégrer les services multimédias réels — galerie photos Galaxy S23 Ultra,
      streaming DLNA depuis PC Bureau vers Samsung TV, et lecture YouTube
      via l'API Samsung TV ou Chromecast.
    </p>
  `;
}

/* -----------------------------------------------
   RENDER — MULTIMEDIA SERVICES
----------------------------------------------- */
function renderMedia() {
  document.getElementById('mediaGrid').innerHTML = MEDIA_SERVICES.map(m => `
    <div class="card media-card">
      <div class="media-icon">${m.icon}</div>
      <div class="media-name">${m.name}</div>
      <div class="media-desc">${m.desc}</div>
      <span class="badge ${m.tagColor} media-tag">${m.tag}</span>
    </div>
  `).join('');
}

/* -----------------------------------------------
   RENDER — SCENARIOS (Phase 5 — moteur orchestrateur)
----------------------------------------------- */
function renderScenarios() {
  const grid = document.getElementById('scenariosGrid');
  if (!grid) return;

  /* Utilise les données du moteur si disponibles, sinon fallback JSON */
  const list = (SCENARIO_RUNTIME && SCENARIO_RUNTIME.scenarios) || SCENARIOS;
  if (!list || !list.length) {
    grid.innerHTML = '<p class="loading-placeholder">Aucun scénario chargé.</p>';
    return;
  }

  const safetyLabels = { safe: 'Sûr', medium: 'Modéré', high: 'Élevé' };

  grid.innerHTML = list.map(s => {
    const devices  = Array.isArray(s.requiredDevices)  ? s.requiredDevices.join(', ')  : (s.devices  || '—');
    const services = Array.isArray(s.requiredServices) ? s.requiredServices.join(', ') : (s.services || '—');
    const safetyLvl = safetyLabels[s.safetyLevel] || s.safetyLevel || '—';
    const stepCount = s.stepCount || (Array.isArray(s.steps) ? s.steps.length : '—');
    const icon = s.icon || '⚙';

    return `
      <div class="card scenario-card5">
        <div class="scenario5-header">
          <span class="scenario5-icon">${icon}</span>
          <div class="scenario5-title-block">
            <div class="scenario5-name">${s.name}</div>
            <div class="scenario5-badges">
              <span class="mode-badge simulated">◎ Simulation</span>
              <span class="safety-badge safe">🛡 ${safetyLvl}</span>
            </div>
          </div>
        </div>
        <div class="scenario5-desc">${s.description || s.desc || ''}</div>
        <div class="scenario5-meta">
          <div class="scenario5-meta-row"><strong>Appareils :</strong> <span>${devices || '—'}</span></div>
          <div class="scenario5-meta-row"><strong>Services :</strong> <span>${services || '—'}</span></div>
          <div class="scenario5-meta-row"><strong>Étapes :</strong> <span>${stepCount}</span></div>
        </div>
        <div class="scenario5-actions">
          <button class="btn-scenario-preview"  onclick="previewScenario('${s.id}')">🔍 Prévisualiser</button>
          <button class="btn-scenario-simulate" onclick="runScenario('${s.id}', 'simulated')">▶ Simuler</button>
          <button class="btn-scenario-assisted" onclick="runScenario('${s.id}', 'assisted')">🤝 Mode assisté</button>
        </div>
      </div>
    `;
  }).join('');
}

/* Phase 5 — Chargement du runtime scénarios depuis l'API */
async function loadScenarioRuntime() {
  const bar = document.getElementById('scenarioEngineBar');
  if (bar) bar.innerHTML = '<span class="loading-placeholder">Connexion au moteur…</span>';

  try {
    const res = await fetchWithTimeout('/api/scenarios/runtime', 3000);
    if (res.ok) {
      SCENARIO_RUNTIME = await res.json();
      if (bar) {
        const liveBlocked = !SCENARIO_RUNTIME.liveEnabled;
        bar.innerHTML = `
          <span class="engine-status-chip ok">⬤ Moteur actif</span>
          <span class="engine-info">${SCENARIO_RUNTIME.count} scénarios disponibles</span>
          ${liveBlocked ? '<span class="mode-badge live-blocked">🔒 Mode live bloqué</span>' : ''}
        `;
      }
    }
  } catch {
    if (bar) bar.innerHTML = '<span class="engine-status-chip simulated">◎ Moteur simulé — backend requis</span>';
  }

  renderScenarios();
}

/* Phase 5 — Prévisualisation d'un scénario */
async function previewScenario(id) {
  showScenarioResult('Prévisualisation en cours…', null);

  try {
    const res = await fetchWithTimeout(`/api/scenarios/${id}/preview`, 5000, { method: 'POST' });
    const data = await res.json();

    if (data.error) { showScenarioResult(null, null, data.error); return; }

    const stepsHtml = (data.steps || []).map((step, i) => `
      <div class="step-timeline-item">
        <span class="step-num">${i + 1}</span>
        <span class="step-label">${step.label}</span>
        <span class="step-type-badge type-${step.type}">${step.type}</span>
        ${step.connector ? `<span class="step-connector">via ${step.connector}</span>` : ''}
      </div>
    `).join('');

    const html = `
      <div class="result-scenario-name">${data.icon || ''} ${data.scenarioName}</div>
      <div class="result-desc">${data.description || ''}</div>
      <div class="result-section-title">Étapes prévues :</div>
      <div class="step-timeline">${stepsHtml}</div>
      <div class="result-note">📋 ${data.note}</div>
    `;
    showScenarioResult(null, html);
  } catch {
    showScenarioResult(null, null, 'Erreur de connexion au backend. Lancez npm start.');
  }
}

/* Phase 5 — Exécution simulation ou mode assisté */
async function runScenario(id, mode) {
  const modeLabel = mode === 'assisted' ? 'Mode assisté' : 'Simulation';
  showScenarioResult(`${modeLabel} en cours…`, null);

  try {
    const res = await fetchWithTimeout(`/api/scenarios/${id}/run`, 8000, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ mode }),
    });
    const data = await res.json();

    if (res.status === 403) {
      showScenarioResult(null, null, `${data.error}\n${data.hint || ''}`);
      return;
    }
    if (data.error) { showScenarioResult(null, null, data.error); return; }

    const stepsHtml = (data.stepsExecuted || []).map((step, i) => {
      const text = step.result || step.instruction || step.label;
      return `
        <div class="step-timeline-item ${step.status}">
          <span class="step-num">${i + 1}</span>
          <span class="step-label">${text}</span>
          ${step.warning ? `<div class="step-warning">⚠ ${step.warning}</div>` : ''}
          ${step.requiresUserAction ? '<span class="step-action-required">Action manuelle requise</span>' : ''}
        </div>
      `;
    }).join('');

    const warningsHtml = (data.warnings || []).length
      ? `<div class="result-warnings">${data.warnings.map(w => `<div class="warning-item">⚠ ${w}</div>`).join('')}</div>`
      : '';

    const html = `
      <div class="result-scenario-name">${data.icon || ''} ${data.scenarioName}
        <span class="mode-badge ${mode}">${mode === 'assisted' ? '🤝 Assisté' : '◎ Simulation'}</span>
      </div>
      <div class="result-summary">${data.summary}</div>
      ${warningsHtml}
      <div class="result-section-title">Étapes exécutées :</div>
      <div class="step-timeline">${stepsHtml}</div>
      <div class="result-timing">Début : ${data.startedAt ? new Date(data.startedAt).toLocaleTimeString() : '—'} · Fin : ${data.finishedAt ? new Date(data.finishedAt).toLocaleTimeString() : '—'}</div>
    `;
    showScenarioResult(null, html);
    loadScenarioHistory();
  } catch {
    showScenarioResult(null, null, 'Erreur de connexion au backend. Lancez npm start.');
  }
}

/* Phase 5 — Affichage du panneau résultat */
function showScenarioResult(loading, html, error) {
  const panel = document.getElementById('scenarioResultPanel');
  const body  = document.getElementById('scenarioResultBody');
  const title = document.getElementById('scenarioResultTitle');
  if (!panel || !body) return;

  panel.style.display = 'block';
  if (loading) {
    if (title) title.textContent = 'Traitement…';
    body.innerHTML = `<p class="loading-placeholder">${loading}</p>`;
  } else if (error) {
    if (title) title.textContent = 'Erreur';
    body.innerHTML = `<div class="result-error">⚠ ${error.replace(/\n/g, '<br>')}</div>`;
  } else {
    if (title) title.textContent = 'Résultat';
    body.innerHTML = html;
  }
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeScenarioResult() {
  const panel = document.getElementById('scenarioResultPanel');
  if (panel) panel.style.display = 'none';
}

/* Phase 5 — Historique des scénarios */
async function loadScenarioHistory() {
  const list = document.getElementById('scenarioHistoryList');
  if (!list) return;

  try {
    const res = await fetchWithTimeout('/api/scenarios/history', 3000);
    if (!res.ok) throw new Error();
    const data = await res.json();
    SCENARIO_HISTORY = data.history || [];
    renderScenarioHistory();
  } catch {
    if (list) list.innerHTML = '<p class="loading-placeholder">Historique non disponible — backend requis.</p>';
  }
}

function renderScenarioHistory() {
  const list = document.getElementById('scenarioHistoryList');
  if (!list) return;

  if (!SCENARIO_HISTORY.length) {
    list.innerHTML = '<p class="loading-placeholder">Aucune exécution enregistrée.</p>';
    return;
  }

  list.innerHTML = SCENARIO_HISTORY.slice(0, 10).map(entry => {
    const date = entry.startedAt ? new Date(entry.startedAt).toLocaleString() : '—';
    const modeBadge = entry.mode === 'assisted'
      ? '<span class="mode-badge assisted">assisté</span>'
      : '<span class="mode-badge simulated">simulé</span>';
    return `
      <div class="history-entry">
        <span class="history-icon">${entry.mode === 'assisted' ? '🤝' : '◎'}</span>
        <div class="history-info">
          <div class="history-name">${entry.scenarioName} ${modeBadge}</div>
          <div class="history-meta">${date} · ${entry.stepsExecuted} étapes · <span class="status-${entry.status}">${entry.status}</span></div>
          ${entry.warnings && entry.warnings.length ? `<div class="history-warnings">${entry.warnings.length} avertissement(s)</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

async function clearScenarioHistory() {
  try {
    const res = await fetchWithTimeout('/api/scenarios/history', 3000, { method: 'DELETE' });
    if (res.ok) {
      SCENARIO_HISTORY = [];
      renderScenarioHistory();
    }
  } catch {
    /* Silencieux */
  }
}

/* =============================================
   PHASE 4 — CENTRE MULTIMÉDIA
============================================= */

/* Fetch avec timeout — helper interne */
function fetchWithTimeout(url, ms = 3000, opts = {}) {
  const ac  = new AbortController();
  const tid = setTimeout(() => ac.abort(), ms);
  return fetch(url, { ...opts, signal: ac.signal }).finally(() => clearTimeout(tid));
}

/* Charge les services, statut et playlists */
async function loadMediaCenter() {
  /* Services — backend d'abord, fallback JSON */
  try {
    const res = await fetchWithTimeout('/api/media/services');
    if (res.ok) MEDIA_SERVICES_DATA = await res.json();
  } catch {
    try { MEDIA_SERVICES_DATA = await fetch('data/media-services.json').then(r => r.json()); } catch {}
  }

  /* Statut connecteurs (backend uniquement) */
  try {
    const res = await fetchWithTimeout('/api/media/status');
    if (res.ok) MEDIA_STATUS = await res.json();
  } catch { MEDIA_STATUS = {}; }

  /* Playlists — backend d'abord, fallback JSON */
  try {
    const res = await fetchWithTimeout('/api/media/playlists');
    if (res.ok) MEDIA_PLAYLISTS = await res.json();
  } catch {
    try { MEDIA_PLAYLISTS = await fetch('data/media-playlists.json').then(r => r.json()); } catch {}
  }
}

/* Rendu du bandeau statut connecteurs */
function renderConnectorStatus() {
  const row = document.getElementById('connectorStatusRow');
  if (!row) return;

  const connectors = [
    { key: 'youtube',      label: 'YouTube Embed' },
    { key: 'localGallery', label: 'Galerie locale' },
    { key: 'adb',          label: 'ADB (mobile)' },
    { key: 'dlna',         label: 'DLNA/UPnP' },
    { key: 'smartThings',  label: 'SmartThings TV' },
  ];

  if (!Object.keys(MEDIA_STATUS).length) {
    row.innerHTML = '<span class="connector-badge simulated">◎ Mode simulé — backend requis pour les statuts live</span>';
    return;
  }

  row.innerHTML = connectors.map(c => {
    const status = MEDIA_STATUS[c.key] || 'unknown';
    const cls    = status === 'available' || status === 'ready' ? 'enabled' : 'disabled';
    const icon   = cls === 'enabled' ? '⬤' : '○';
    return `<span class="connector-badge ${cls}" title="${status}">${icon} ${c.label}</span>`;
  }).join('');
}

/* Rendu des cartes de services */
function renderMediaServiceCards() {
  const grid = document.getElementById('mediaServicesGrid');
  if (!grid) return;
  if (!MEDIA_SERVICES_DATA.length) {
    grid.innerHTML = '<p class="loading-placeholder">Aucun service chargé.</p>';
    return;
  }

  grid.innerHTML = MEDIA_SERVICES_DATA.map(s => {
    const liveStatus  = MEDIA_STATUS[s.connector] || s.connectorStatus || null;
    const isActive    = liveStatus === 'available' || liveStatus === 'ready';
    const statusCls   = liveStatus ? (isActive ? 'enabled' : 'disabled') : 'simulated';
    const statusLabel = liveStatus
      ? (isActive ? 'Disponible' : liveStatus === 'disabled' ? 'Désactivé' : liveStatus)
      : 'Simulé';

    return `
      <div class="card media-service-card">
        <div class="media-icon">${s.icon}</div>
        <div class="media-name">${s.name}</div>
        <div class="media-desc">${s.desc}</div>
        <div class="media-card-footer">
          <span class="badge ${s.tagColor} media-tag">${s.tag}</span>
          <span class="connector-badge ${statusCls} sm">${statusLabel}</span>
        </div>
      </div>
    `;
  }).join('');
}

/* Rendu des playlists */
function renderPlaylists() {
  const grid = document.getElementById('playlistsGrid');
  if (!grid) return;
  if (!MEDIA_PLAYLISTS.length) {
    grid.innerHTML = '<p class="loading-placeholder">Aucune playlist chargée.</p>';
    return;
  }

  grid.innerHTML = MEDIA_PLAYLISTS.map(pl => `
    <div class="card playlist-card">
      <div class="media-icon">${pl.icon}</div>
      <div class="media-name">${pl.name}</div>
      <div class="media-desc">${pl.desc}</div>
      <div class="playlist-meta">
        <span class="playlist-count">${pl.items.length} élément${pl.items.length > 1 ? 's' : ''}</span>
        <span class="playlist-scenario">${pl.scenario}</span>
      </div>
    </div>
  `).join('');
}

/* Actualisation manuelle des services */
async function refreshMediaServices() {
  const grid = document.getElementById('mediaServicesGrid');
  if (grid) grid.innerHTML = '<p class="loading-placeholder">Actualisation…</p>';
  await loadMediaCenter();
  renderConnectorStatus();
  renderMediaServiceCards();
  renderPlaylists();
}

/* Scan galerie locale */
async function scanLocalGallery() {
  const resultBox = document.getElementById('galleryResults');
  const content   = document.getElementById('galleryContent');
  if (!resultBox || !content) return;

  resultBox.style.display = 'block';
  content.innerHTML = '<p class="loading-placeholder">Scan en cours…</p>';

  try {
    const res = await fetchWithTimeout('/api/media/gallery/scan', 8000, { method: 'POST' });
    const data = await res.json();

    if (data.error) {
      content.innerHTML = `<div class="gallery-error">⚠ ${data.error}</div>`;
      return;
    }
    if (!data.files || !data.files.length) {
      content.innerHTML = '<p class="loading-placeholder">Aucun fichier image trouvé.</p>';
      return;
    }
    content.innerHTML = `
      <p class="gallery-count">${data.count} fichier(s) trouvé(s)</p>
      <div class="gallery-file-grid">
        ${data.files.map(f => `<span class="gallery-file-chip">${f.name}</span>`).join('')}
      </div>
    `;
  } catch {
    content.innerHTML = '<div class="gallery-error">⚠ Backend requis pour le scan galerie. Lancer <code>npm start</code>.</div>';
  }
}

/* Aperçu YouTube embed */
function previewYoutube() {
  const input = document.getElementById('youtubeUrlInput');
  const wrap  = document.getElementById('youtubePreviewWrap');
  const iframe = document.getElementById('youtubeIframe');
  const msg   = document.getElementById('youtubeMsg');
  if (!input || !wrap || !iframe || !msg) return;

  const url = input.value.trim();
  if (!url) { showYoutubeMsg('Collez une URL YouTube valide.', 'error'); return; }

  /* Extraction locale de l'ID (ne nécessite pas le backend) */
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /embed\/([a-zA-Z0-9_-]{11})/,
    /shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  let videoId = null;
  for (const re of patterns) { const m = url.match(re); if (m) { videoId = m[1]; break; } }

  if (!videoId) {
    showYoutubeMsg('URL non reconnue. Exemple : https://www.youtube.com/watch?v=XXXXXXXXXXX', 'error');
    wrap.style.display = 'none';
    return;
  }

  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=0`;
  wrap.style.display = 'block';
  msg.style.display  = 'none';
}

function clearYoutube() {
  const input  = document.getElementById('youtubeUrlInput');
  const wrap   = document.getElementById('youtubePreviewWrap');
  const iframe = document.getElementById('youtubeIframe');
  const msg    = document.getElementById('youtubeMsg');
  if (input)  input.value = '';
  if (iframe) iframe.src  = '';
  if (wrap)   wrap.style.display = 'none';
  if (msg)    msg.style.display  = 'none';
}

function showYoutubeMsg(text, type = 'error') {
  const msg = document.getElementById('youtubeMsg');
  if (!msg) return;
  msg.textContent  = text;
  msg.className    = `youtube-msg ${type}`;
  msg.style.display = 'block';
}

/* =============================================
   PHASE 6 — DIAGNOSTIC ADB
============================================= */

const ADB_STATUS_LABELS = {
  disabled:     { label: 'Désactivé',     cls: 'disabled',     icon: '○' },
  unavailable:  { label: 'Non installé',  cls: 'unavailable',  icon: '⊘' },
  no_device:    { label: 'Aucun appareil',cls: 'no-device',    icon: '◌' },
  unauthorized: { label: 'Non autorisé',  cls: 'unauthorized', icon: '⊗' },
  available:    { label: 'Connecté',      cls: 'available',    icon: '⬤' },
  error:        { label: 'Erreur',        cls: 'error',        icon: '⚠' },
};

async function loadAdbStatus() {
  try {
    const res = await fetchWithTimeout('/api/adb/status', 4000);
    if (res.ok) ADB_STATUS = await res.json();
  } catch { ADB_STATUS = null; }
}

async function loadAdbDiagnostics() {
  try {
    const res = await fetchWithTimeout('/api/adb/diagnostics', 6000);
    if (res.ok) ADB_DIAGNOSTICS = await res.json();
  } catch { ADB_DIAGNOSTICS = null; }
}

async function refreshAdbDiagnostics() {
  const panel = document.getElementById('adbPanel');
  if (panel) panel.innerHTML = '<p class="loading-placeholder">Actualisation en cours…</p>';

  await Promise.all([loadAdbStatus(), loadAdbDiagnostics()]);
  renderAdbPanel();
}

function renderAdbPanel() {
  const panel = document.getElementById('adbPanel');
  if (!panel) return;

  /* Si backend non disponible */
  if (!ADB_STATUS && !ADB_DIAGNOSTICS) {
    panel.innerHTML = `
      <div class="adb-status-row">
        <span class="adb-badge disabled">○ Backend requis</span>
        <span class="adb-hint">Lancez <code>npm start</code> pour activer le diagnostic ADB.</span>
      </div>
    `;
    return;
  }

  const raw    = ADB_DIAGNOSTICS || ADB_STATUS || {};
  const status = raw.status || 'disabled';
  const info   = ADB_STATUS_LABELS[status] || { label: status, cls: 'disabled', icon: '?' };

  /* Cas : désactivé */
  if (status === 'disabled') {
    panel.innerHTML = `
      <div class="adb-status-row">
        <span class="adb-badge ${info.cls}">${info.icon} ${info.label}</span>
        <span class="adb-hint">${raw.message || 'Activez ADB_ENABLED=true dans .env pour continuer.'}</span>
      </div>
      <div class="adb-how-to">
        <strong>Comment activer :</strong>
        <ol>
          <li>Installer <a href="https://developer.android.com/tools/releases/platform-tools" target="_blank" rel="noopener">Android Platform Tools</a></li>
          <li>Dans <code>.env</code> : <code>ADB_ENABLED=true</code> et <code>ADB_PATH=&lt;chemin/adb&gt;</code></li>
          <li>Activer "Options développeur" sur le téléphone</li>
          <li>Activer "Débogage USB"</li>
          <li>Connecter le téléphone et accepter l'autorisation</li>
        </ol>
      </div>
    `;
    return;
  }

  /* Cas : ADB non installé / aucun appareil / non autorisé */
  if (['unavailable', 'no_device', 'unauthorized', 'error'].includes(status)) {
    panel.innerHTML = `
      <div class="adb-status-row">
        <span class="adb-badge ${info.cls}">${info.icon} ${info.label}</span>
        <span class="adb-hint">${raw.message || ''}</span>
      </div>
    `;
    return;
  }

  /* Cas : disponible — afficher les diagnostics */
  const d = ADB_DIAGNOSTICS || {};

  const batteryLevel = d.battery && d.battery.level != null ? d.battery.level + '%' : '—';
  const batteryPlugged = d.battery && d.battery.plugged != null
    ? (d.battery.plugged ? '⚡ En charge' : '🔋 Sur batterie') : '—';

  const storageTotal = d.storage && d.storage.totalKb
    ? Math.round(d.storage.totalKb / 1024) + ' Mo'  : '—';
  const storageAvail = d.storage && d.storage.availKb
    ? Math.round(d.storage.availKb / 1024) + ' Mo'  : '—';

  const model        = d.model && d.model.model        ? d.model.model        : '—';
  const manufacturer = d.model && d.model.manufacturer ? d.model.manufacturer : '—';
  const android      = d.androidVersion && d.androidVersion.androidVersion
    ? 'Android ' + d.androidVersion.androidVersion : '—';

  panel.innerHTML = `
    <div class="adb-status-row">
      <span class="adb-badge ${info.cls}">${info.icon} ${info.label}</span>
      ${d.masked ? '<span class="adb-masked-note">🔒 ID masqué</span>' : ''}
      ${d.readOnly ? '<span class="adb-readonly-note">🔍 Lecture seule</span>' : ''}
    </div>
    <div class="adb-diag-grid">
      <div class="adb-diag-item"><span class="adb-diag-label">Fabricant</span><span class="adb-diag-val">${manufacturer}</span></div>
      <div class="adb-diag-item"><span class="adb-diag-label">Modèle</span><span class="adb-diag-val">${model}</span></div>
      <div class="adb-diag-item"><span class="adb-diag-label">Système</span><span class="adb-diag-val">${android}</span></div>
      <div class="adb-diag-item"><span class="adb-diag-label">Batterie</span><span class="adb-diag-val">${batteryLevel} ${batteryPlugged}</span></div>
      <div class="adb-diag-item"><span class="adb-diag-label">Stockage total</span><span class="adb-diag-val">${storageTotal}</span></div>
      <div class="adb-diag-item"><span class="adb-diag-label">Espace libre</span><span class="adb-diag-val">${storageAvail}</span></div>
    </div>
    ${d.securityNote ? `<div class="adb-security-note">${d.securityNote}</div>` : ''}
    ${d.lastCheckedAt ? `<div class="adb-last-check">Dernière vérification : ${new Date(d.lastCheckedAt).toLocaleTimeString()}</div>` : ''}
  `;
}

/* =============================================
   PHASE 7 — DÉCOUVERTE DLNA/UPnP
============================================= */

const DLNA_STATUS_LABELS = {
  disabled:   { label: 'Désactivé',         cls: 'disabled',   icon: '○' },
  unavailable:{ label: 'Non disponible',     cls: 'unavailable',icon: '⊘' },
  no_cache:   { label: 'Pas encore découvert', cls: 'no-device', icon: '◌' },
  no_device:  { label: 'Aucun appareil',     cls: 'no-device',  icon: '◌' },
  ready:      { label: 'Prêt',              cls: 'ready',      icon: '◎' },
  available:  { label: 'Appareils détectés', cls: 'available',  icon: '⬤' },
  error:      { label: 'Erreur',            cls: 'error',      icon: '⚠' },
};

async function loadDlnaStatus() {
  try {
    const res = await fetchWithTimeout('/api/dlna/status', 3000);
    if (res.ok) DLNA_STATUS = await res.json();
  } catch { DLNA_STATUS = null; }
}

async function loadDlnaDevices() {
  try {
    const res = await fetchWithTimeout('/api/dlna/devices', 3000);
    if (res.ok) DLNA_DEVICES = await res.json();
  } catch { DLNA_DEVICES = null; }
}

async function runDlnaDiscovery() {
  const panel = document.getElementById('dlnaPanel');
  if (panel) panel.innerHTML = '<p class="loading-placeholder">Découverte en cours… (jusqu\'à 3 secondes)</p>';

  try {
    const res = await fetchWithTimeout('/api/dlna/discover', 8000, { method: 'POST' });
    if (res.ok) {
      DLNA_DEVICES = await res.json();
      DLNA_STATUS  = DLNA_DEVICES;
    }
  } catch { /* silencieux */ }

  renderDlnaPanel();
}

async function loadDlnaRenderers() {
  try {
    const res = await fetchWithTimeout('/api/dlna/renderers', 5000);
    return res.ok ? (await res.json()).renderers || [] : [];
  } catch { return []; }
}

async function loadDlnaServers() {
  try {
    const res = await fetchWithTimeout('/api/dlna/servers', 5000);
    return res.ok ? (await res.json()).servers || [] : [];
  } catch { return []; }
}

async function loadDlnaPlayers() {
  try {
    const res = await fetchWithTimeout('/api/dlna/players', 5000);
    return res.ok ? (await res.json()).players || [] : [];
  } catch { return []; }
}

async function clearDlnaCache() {
  try {
    const res = await fetchWithTimeout('/api/dlna/cache', 3000, { method: 'DELETE' });
    if (res.ok) {
      DLNA_DEVICES = null;
      renderDlnaPanel();
    }
  } catch { /* silencieux */ }
}

function renderDlnaPanel() {
  const panel = document.getElementById('dlnaPanel');
  if (!panel) return;

  /* Backend non disponible */
  if (!DLNA_STATUS && !DLNA_DEVICES) {
    panel.innerHTML = `
      <div class="dlna-status-row">
        <span class="dlna-badge disabled">○ Backend requis</span>
        <span class="dlna-hint">Lancez <code>npm start</code> pour activer DLNA.</span>
      </div>
    `;
    return;
  }

  const data   = DLNA_DEVICES || DLNA_STATUS || {};
  const status = data.status || 'disabled';
  const info   = DLNA_STATUS_LABELS[status] || { label: status, cls: 'disabled', icon: '?' };

  if (status === 'disabled') {
    panel.innerHTML = `
      <div class="dlna-status-row">
        <span class="dlna-badge ${info.cls}">${info.icon} ${info.label}</span>
        <span class="dlna-hint">${data.message || 'Activez DLNA_ENABLED=true dans .env'}</span>
      </div>
      <div class="dlna-how-to">
        <strong>Comment activer :</strong>
        Dans <code>.env</code> : <code>DLNA_ENABLED=true</code> puis redémarrer le serveur.
      </div>
    `;
    return;
  }

  if (['no_cache', 'no_device', 'ready'].includes(status)) {
    panel.innerHTML = `
      <div class="dlna-status-row">
        <span class="dlna-badge ${info.cls}">${info.icon} ${info.label}</span>
        <span class="dlna-hint">${data.message || 'Cliquez "Découvrir appareils" pour lancer une recherche.'}</span>
      </div>
    `;
    return;
  }

  /* Appareils trouvés */
  const devices   = data.devices   || [];
  const renderers = data.renderers || [];
  const servers   = data.servers   || [];
  const players   = data.players   || [];
  const masked    = data.masked !== false;
  const lastAt    = data.discoveredAt || data.lastDiscoveryAt;

  const deviceHtml = (list, type) => list.length
    ? list.map(d => `
        <div class="dlna-device-card">
          <span class="dlna-type-tag ${type}">${type}</span>
          <div class="dlna-device-name">${d.description && d.description.friendlyName ? d.description.friendlyName : (d.server || d.usn || '—').slice(0, 60)}</div>
          ${d.description && d.description.manufacturer ? `<div class="dlna-device-meta">${d.description.manufacturer}</div>` : ''}
          ${d.description && d.description.modelName ? `<div class="dlna-device-meta">${d.description.modelName}</div>` : ''}
          <div class="dlna-device-ip">${masked ? '🔒 IP masquée' : (d.ip || '—')}</div>
        </div>`).join('')
    : '<span class="dlna-none">Aucun</span>';

  panel.innerHTML = `
    <div class="dlna-status-row">
      <span class="dlna-badge ${info.cls}">${info.icon} ${info.label}</span>
      <span class="dlna-count">${data.count || devices.length} appareil(s)</span>
      ${masked ? '<span class="dlna-masked-note">🔒 IP masquées</span>' : ''}
      <span class="dlna-readonly-note">🔍 Lecture seule</span>
    </div>
    <div class="dlna-stats-row">
      <span class="dlna-stat">📺 Renderers : <strong>${renderers.length || data.rendererCount || 0}</strong></span>
      <span class="dlna-stat">💾 Serveurs : <strong>${servers.length || data.serverCount || 0}</strong></span>
      <span class="dlna-stat">▶ Players : <strong>${players.length || data.playerCount || 0}</strong></span>
    </div>
    ${renderers.length ? `<div class="dlna-section-title">Renderers (TV/lecteurs)</div><div class="dlna-device-grid">${deviceHtml(renderers, 'renderer')}</div>` : ''}
    ${servers.length   ? `<div class="dlna-section-title">Serveurs médias</div><div class="dlna-device-grid">${deviceHtml(servers, 'server')}</div>` : ''}
    ${players.length   ? `<div class="dlna-section-title">Players</div><div class="dlna-device-grid">${deviceHtml(players, 'player')}</div>` : ''}
    ${lastAt ? `<div class="dlna-last-check">Dernière découverte : ${new Date(lastAt).toLocaleTimeString()}</div>` : ''}
  `;
}

/* =============================================
   PHASE 8 — SMARTTHINGS SAMSUNG TV
============================================= */

const ST_STATUS_LABELS = {
  disabled:      { label: 'Désactivé',        cls: 'disabled',      icon: '○' },
  missing_token: { label: 'Token manquant',   cls: 'missing-token', icon: '⚠' },
  unauthorized:  { label: 'Token invalide',   cls: 'unauthorized',  icon: '✕' },
  unavailable:   { label: 'API indisponible', cls: 'unavailable',   icon: '⊘' },
  available:     { label: 'Disponible',       cls: 'available',     icon: '⬤' },
  error:         { label: 'Erreur',           cls: 'error',         icon: '⚠' },
};

async function loadSmartThingsStatus() {
  try {
    const res = await fetchWithTimeout('/api/smartthings/status', 6000);
    if (res.ok) SMARTTHINGS_STATUS = await res.json();
  } catch { SMARTTHINGS_STATUS = null; }
}

async function loadSmartThingsDevices() {
  try {
    const res = await fetchWithTimeout('/api/smartthings/devices', 8000);
    if (res.ok) {
      SMARTTHINGS_DEVICES = await res.json();
      renderSmartThingsDevices();
    }
  } catch { SMARTTHINGS_DEVICES = null; }
}

async function loadSmartThingsTv() {
  try {
    const res = await fetchWithTimeout('/api/smartthings/tv', 8000);
    if (!res.ok) return;
    const data = await res.json();
    const panel = document.getElementById('stTvPanel');
    const info  = document.getElementById('stTvInfo');
    if (!panel || !info) return;
    if (data.status === 'found' && data.tv) {
      const tv = data.tv;
      info.innerHTML = `
        <div class="st-tv-card">
          <div class="st-tv-name">${tv.label || tv.name || 'TV Samsung'}</div>
          <div class="st-tv-meta">Type : ${tv.type || '—'}</div>
          <div class="st-tv-meta">ID : <span class="st-id-masked">${tv.deviceId || '—'}</span> 🔒</div>
          <div class="st-tv-source">Source : ${data.source === 'configured' ? '⚙ Configurée' : '🔍 Détection auto'}</div>
          <div class="st-tv-note">${data.note || ''}</div>
        </div>
      `;
      panel.style.display = '';
    } else {
      info.innerHTML = `<p class="st-hint">${data.message || 'Aucune TV Samsung détectée dans SmartThings.'}</p>`;
      panel.style.display = '';
    }
  } catch { /* silencieux */ }
}

async function loadSmartThingsScenes() {
  try {
    const res = await fetchWithTimeout('/api/smartthings/scenes', 8000);
    if (res.ok) {
      SMARTTHINGS_SCENES = await res.json();
      renderSmartThingsScenes();
    }
  } catch { SMARTTHINGS_SCENES = null; }
}

async function previewSmartThingsScene(sceneId) {
  try {
    const res = await fetchWithTimeout(`/api/smartthings/scenes/${sceneId}/preview`, 8000, { method: 'POST' });
    if (!res.ok) return;
    const data = await res.json();
    alert(
      `Prévisualisation : ${data.sceneName || sceneId}\n` +
      `\n${data.message || ''}\n` +
      `\n⚠ ${data.securityWarning || 'Aucune scène exécutée.'}`
    );
  } catch { /* silencieux */ }
}

function renderSmartThingsPanel() {
  const panel = document.getElementById('stPanel');
  if (!panel) return;

  if (!SMARTTHINGS_STATUS) {
    panel.innerHTML = `
      <div class="st-status-row">
        <span class="st-badge disabled">○ Backend requis</span>
        <span class="st-hint">Lancez <code>npm start</code> pour activer SmartThings.</span>
      </div>
    `;
    return;
  }

  const data   = SMARTTHINGS_STATUS;
  const status = data.status || 'disabled';
  const info   = ST_STATUS_LABELS[status] || { label: status, cls: 'disabled', icon: '?' };

  if (status === 'disabled') {
    panel.innerHTML = `
      <div class="st-status-row">
        <span class="st-badge ${info.cls}">${info.icon} ${info.label}</span>
        <span class="st-hint">Activez SmartThings dans <code>.env</code> pour continuer.</span>
      </div>
      <div class="st-how-to">
        <strong>Comment activer :</strong>
        <ol>
          <li>Créer un token sur <a href="https://account.smartthings.com/tokens" target="_blank" rel="noopener noreferrer">account.smartthings.com/tokens</a></li>
          <li>Scopes : <code>devices:read</code> <code>locations:read</code> <code>scenes:read</code></li>
          <li>Dans <code>.env</code> : <code>SMARTTHINGS_TOKEN=...</code> et <code>SMARTTHINGS_ENABLED=true</code></li>
          <li>Garder <code>SMARTTHINGS_READ_ONLY=true</code> et <code>SMARTTHINGS_ALLOW_SCENE_EXECUTION=false</code></li>
        </ol>
      </div>
    `;
    return;
  }

  if (status === 'missing_token') {
    panel.innerHTML = `
      <div class="st-status-row">
        <span class="st-badge ${info.cls}">${info.icon} ${info.label}</span>
        <span class="st-hint">Ajoutez <code>SMARTTHINGS_TOKEN=...</code> dans <code>.env</code></span>
      </div>
    `;
    return;
  }

  if (['unauthorized', 'unavailable', 'error'].includes(status)) {
    panel.innerHTML = `
      <div class="st-status-row">
        <span class="st-badge ${info.cls}">${info.icon} ${info.label}</span>
        <span class="st-hint">${data.message || ''}</span>
      </div>
    `;
    return;
  }

  /* Disponible */
  panel.innerHTML = `
    <div class="st-status-row">
      <span class="st-badge ${info.cls}">${info.icon} ${info.label}</span>
      <span class="st-readonly-badge">🔍 Lecture seule</span>
      <span class="st-masked-badge">🔒 IDs masqués</span>
    </div>
    <div class="st-info-grid">
      <div class="st-info-item"><span class="st-info-label">Token</span><span class="st-info-val">${data.tokenConfigured ? '✅ Configuré (masqué)' : '✕ Absent'}</span></div>
      <div class="st-info-item"><span class="st-info-label">Location</span><span class="st-info-val">${data.locationConfigured ? '✅ Configurée' : '— Non configurée'}</span></div>
      <div class="st-info-item"><span class="st-info-label">TV configurée</span><span class="st-info-val">${data.tvConfigured ? '✅ Oui' : '— Non'}</span></div>
      <div class="st-info-item"><span class="st-info-label">Exécution scène</span><span class="st-info-val">🔒 Désactivée</span></div>
    </div>
    ${data.lastCheckedAt ? `<div class="st-last-check">Vérifié à : ${new Date(data.lastCheckedAt).toLocaleTimeString()}</div>` : ''}
  `;

  /* Charger TV automatiquement si disponible */
  loadSmartThingsTv();
}

function renderSmartThingsDevices() {
  const panel = document.getElementById('stDevicesPanel');
  const list  = document.getElementById('stDevicesList');
  if (!panel || !list) return;

  const data = SMARTTHINGS_DEVICES;
  if (!data || data.status !== 'available' || !data.devices?.length) {
    list.innerHTML = `<p class="st-hint">${data?.message || 'Aucun appareil trouvé ou SmartThings non disponible.'}</p>`;
    panel.style.display = '';
    return;
  }

  list.innerHTML = data.devices.map(d => `
    <div class="st-device-card">
      <div class="st-device-name">${d.label || d.name || '—'}</div>
      <div class="st-device-meta">Type : ${d.type || '—'}</div>
      ${d.manufacturer ? `<div class="st-device-meta">Fab. : ${d.manufacturer}</div>` : ''}
      <div class="st-device-id">ID : <span class="st-id-masked">${d.deviceId || '—'}</span> 🔒</div>
    </div>
  `).join('');

  panel.style.display = '';
}

function renderSmartThingsScenes() {
  const panel = document.getElementById('stScenesPanel');
  const list  = document.getElementById('stScenesList');
  if (!panel || !list) return;

  const data = SMARTTHINGS_SCENES;
  if (!data || data.status !== 'available' || !data.scenes?.length) {
    list.innerHTML = `<p class="st-hint">${data?.message || 'Aucune scène disponible ou SmartThings non configuré.'}</p>`;
    panel.style.display = '';
    return;
  }

  list.innerHTML = data.scenes.map(s => `
    <div class="st-scene-card">
      <div class="st-scene-name">${s.sceneName || '—'}</div>
      <div class="st-scene-id">ID : <span class="st-id-masked">${s.sceneId || '—'}</span> 🔒</div>
      <button class="btn-st-preview-scene" onclick="previewSmartThingsScene('${s.sceneId}')">
        👁 Prévisualiser (sans exécuter)
      </button>
    </div>
  `).join('');

  panel.style.display = '';
}

/* =============================================
   PHASE 9 — EXÉCUTION DE SCÈNES SMARTTHINGS
============================================= */

async function loadSmartThingsExecutionPolicy() {
  try {
    const res = await fetchWithTimeout('/api/smartthings/scenes/execution-policy', 5000);
    if (res.ok) {
      ST_EXECUTION_POLICY = await res.json();
      renderSmartThingsExecutionPolicy();
      // Si exécution activée, charger aussi les scènes exécutables
      if (ST_EXECUTION_POLICY && ST_EXECUTION_POLICY.enabled) {
        await loadExecutableScenes();
      }
    }
  } catch { ST_EXECUTION_POLICY = null; }
}

async function loadExecutableScenes() {
  try {
    const res = await fetchWithTimeout('/api/smartthings/scenes/executable', 8000);
    if (res.ok) {
      ST_EXECUTABLE_SCENES = await res.json();
      renderExecutableScenes();
    }
  } catch { ST_EXECUTABLE_SCENES = null; }
}

async function loadSmartThingsSceneAudit() {
  try {
    const res = await fetchWithTimeout('/api/smartthings/scenes/audit', 5000);
    if (res.ok) {
      ST_AUDIT = await res.json();
      renderSceneAudit();
    }
  } catch { ST_AUDIT = null; }
}

async function clearSmartThingsSceneAudit() {
  try {
    const res = await fetchWithTimeout('/api/smartthings/scenes/audit', 5000, { method: 'DELETE' });
    if (res.ok) {
      ST_AUDIT = { count: 0, entries: [] };
      renderSceneAudit();
    }
  } catch { /* silencieux */ }
}

/* Affiche le formulaire de confirmation pour une scène */
function executeSmartThingsScene(sceneId, sceneName) {
  ST_PENDING_SCENE_ID = sceneId;
  const panel = document.getElementById('stExecutionPanel');
  if (!panel) return;

  panel.style.display = '';
  panel.innerHTML = `
    <div class="st-execute-box">
      <div class="st-execute-title">▶ Exécuter une scène SmartThings</div>
      <div class="st-execute-warning">
        ⚠ Cette action est RÉELLE et affectera vos appareils SmartThings autorisés.
        Aucune commande directe à la TV. Aucun appareil sensible. Audit enregistré.
      </div>
      <div class="st-execute-scene-name">Scène : <strong>${sceneName || sceneId}</strong></div>
      <div class="st-execute-field">
        <label class="st-execute-label">Code de confirmation *</label>
        <input type="text" id="stConfirmCode" class="st-execute-input"
          placeholder="Saisissez le code configuré dans .env" autocomplete="off" />
      </div>
      <div class="st-execute-field">
        <label class="st-execute-label">Raison (optionnel)</label>
        <input type="text" id="stExecuteReason" class="st-execute-input"
          placeholder="Ex: Mode cinéma activé depuis Sallon-ConnecT" maxlength="200" />
      </div>
      <div class="st-execute-buttons">
        <button class="btn-st-exec-confirm" onclick="confirmSmartThingsExecution()">
          ▶ Confirmer l'exécution
        </button>
        <button class="btn-st-exec-cancel" onclick="cancelSmartThingsExecution()">
          ✕ Annuler
        </button>
      </div>
      <div class="st-execute-safety">
        🔒 Commandes directes bloquées · IDs masqués · Audit local obligatoire
      </div>
    </div>
  `;
  panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function confirmSmartThingsExecution() {
  const panel  = document.getElementById('stExecutionPanel');
  const code   = document.getElementById('stConfirmCode')?.value  || '';
  const reason = document.getElementById('stExecuteReason')?.value || '';
  const sceneId = ST_PENDING_SCENE_ID;

  if (!sceneId) {
    if (panel) panel.innerHTML = '<div class="st-execute-result error"><div>Erreur : aucune scène sélectionnée.</div><button class="btn-st-exec-cancel" onclick="cancelSmartThingsExecution()">Fermer</button></div>';
    return;
  }

  if (panel) panel.innerHTML = '<p class="loading-placeholder">Exécution en cours…</p>';

  try {
    const res = await fetchWithTimeout(
      `/api/smartthings/scenes/${sceneId}/execute`,
      12000,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationCode: code, reason }),
      }
    );
    const data = await res.json();

    if (data.success) {
      panel.innerHTML = `
        <div class="st-execute-result success">
          <div class="st-result-title">✅ Scène exécutée avec succès</div>
          <div class="st-result-row"><span class="st-result-label">Scène</span><span>${data.sceneName || '—'}</span></div>
          <div class="st-result-row"><span class="st-result-label">ID masqué</span><span class="st-id-masked">${data.sceneId || '—'}</span></div>
          <div class="st-result-row"><span class="st-result-label">Audit ID</span><span>${data.auditId || '—'}</span></div>
          <div class="st-result-row"><span class="st-result-label">Exécuté à</span><span>${data.executedAt ? new Date(data.executedAt).toLocaleTimeString() : '—'}</span></div>
          <div class="st-result-warning">${data.securityWarning || ''}</div>
          <button class="btn-st-exec-cancel" onclick="cancelSmartThingsExecution(); loadSmartThingsSceneAudit();">Fermer et voir l'audit</button>
        </div>
      `;
    } else {
      panel.innerHTML = `
        <div class="st-execute-result error">
          <div class="st-result-title">✕ Exécution refusée</div>
          <div class="st-result-error">${data.error || data.message || 'Erreur inconnue'}</div>
          <button class="btn-st-exec-cancel" onclick="cancelSmartThingsExecution()">Fermer</button>
        </div>
      `;
    }
    ST_PENDING_SCENE_ID = null;
  } catch {
    if (panel) panel.innerHTML = `
      <div class="st-execute-result error">
        <div class="st-result-title">✕ Erreur réseau</div>
        <div class="st-result-error">Impossible de contacter le serveur.</div>
        <button class="btn-st-exec-cancel" onclick="cancelSmartThingsExecution()">Fermer</button>
      </div>
    `;
  }
}

function cancelSmartThingsExecution() {
  ST_PENDING_SCENE_ID = null;
  const panel = document.getElementById('stExecutionPanel');
  if (panel) { panel.style.display = 'none'; panel.innerHTML = ''; }
}

function renderSmartThingsExecutionPolicy() {
  const panel = document.getElementById('stExecutionPolicyPanel');
  const content = document.getElementById('stExecutionPolicyContent');
  if (!panel || !content) return;

  if (!ST_EXECUTION_POLICY) {
    content.innerHTML = '<p class="st-hint">Politique non chargée. Lancez le serveur et cliquez "Politique d\'exécution".</p>';
    panel.style.display = '';
    return;
  }

  const p = ST_EXECUTION_POLICY;
  content.innerHTML = `
    <div class="st-policy-grid">
      <div class="st-policy-item">
        <span class="st-policy-label">Exécution activée</span>
        <span class="st-policy-val ${p.enabled ? 'st-policy-on' : 'st-policy-off'}">
          ${p.enabled ? '✅ Activée' : '🔒 Désactivée'}
        </span>
      </div>
      <div class="st-policy-item">
        <span class="st-policy-label">Confirmation requise</span>
        <span class="st-policy-val ${p.confirmationRequired ? 'st-policy-on' : 'st-policy-warn'}">
          ${p.confirmationRequired ? '✅ Oui' : '⚠ Non'}
        </span>
      </div>
      <div class="st-policy-item">
        <span class="st-policy-label">Scènes allowlistées</span>
        <span class="st-policy-val ${p.allowlistCount > 0 ? 'st-policy-on' : 'st-policy-off'}">
          ${p.allowlistCount > 0 ? `✅ ${p.allowlistCount} scène(s)` : '✕ Aucune'}
        </span>
      </div>
      <div class="st-policy-item">
        <span class="st-policy-label">Audit local</span>
        <span class="st-policy-val ${p.auditEnabled ? 'st-policy-on' : 'st-policy-off'}">
          ${p.auditEnabled ? '✅ Actif' : '✕ Désactivé'}
        </span>
      </div>
      <div class="st-policy-item">
        <span class="st-policy-label">Cmdes directes</span>
        <span class="st-policy-val st-policy-on">🔒 Bloquées</span>
      </div>
      <div class="st-policy-item">
        <span class="st-policy-label">Appareils sensibles</span>
        <span class="st-policy-val st-policy-on">🔒 Bloqués</span>
      </div>
    </div>
    ${!p.enabled ? '<div class="st-policy-hint">Pour activer : <code>SMARTTHINGS_ALLOW_SCENE_EXECUTION=true</code> + <code>SMARTTHINGS_SCENE_ALLOWLIST=scene-id-1,scene-id-2</code></div>' : ''}
  `;
  panel.style.display = '';
}

function renderExecutableScenes() {
  const panel = document.getElementById('stExecutablePanel');
  const list  = document.getElementById('stExecutableList');
  if (!panel || !list) return;

  const data = ST_EXECUTABLE_SCENES;
  if (!data) { list.innerHTML = '<p class="st-hint">Chargement…</p>'; panel.style.display = ''; return; }

  if (data.status === 'disabled') {
    list.innerHTML = `<p class="st-hint">${data.message || 'Exécution désactivée (SMARTTHINGS_ALLOW_SCENE_EXECUTION=false).'}</p>`;
    panel.style.display = '';
    return;
  }

  if (data.status === 'no_allowlist') {
    list.innerHTML = `<p class="st-hint">${data.message || 'Aucune scène dans l\'allowlist (SMARTTHINGS_SCENE_ALLOWLIST).'}</p>`;
    panel.style.display = '';
    return;
  }

  if (!data.scenes || data.scenes.length === 0) {
    list.innerHTML = '<p class="st-hint">Aucune scène allowlistée trouvée dans SmartThings.</p>';
    panel.style.display = '';
    return;
  }

  list.innerHTML = data.scenes.map(s => `
    <div class="st-executable-card">
      <div class="st-executable-info">
        <div class="st-scene-name">${s.sceneName || '—'}</div>
        <div class="st-scene-id">ID : <span class="st-id-masked">${s.sceneIdDisplay || s.sceneId}</span> 🔒</div>
        ${s.requiresConfirmation ? '<div class="st-scene-confirm-note">🔐 Confirmation requise</div>' : ''}
      </div>
      <div class="st-executable-actions">
        <button class="btn-st-preview-scene"
          onclick="previewSmartThingsScene('${s.sceneId}')">
          👁 Prévisualiser
        </button>
        <button class="btn-st-exec-scene ${data.policy && !data.policy.enabled ? 'btn-st-exec-disabled' : ''}"
          onclick="executeSmartThingsScene('${s.sceneId}', '${(s.sceneName || '').replace(/'/g, "\\'")}')"
          ${data.policy && !data.policy.enabled ? 'disabled title="Activez SMARTTHINGS_ALLOW_SCENE_EXECUTION=true"' : ''}>
          ▶ Exécuter
        </button>
      </div>
    </div>
  `).join('');

  panel.style.display = '';
}

function renderSceneAudit() {
  const panel = document.getElementById('stAuditPanel');
  const list  = document.getElementById('stAuditList');
  if (!panel || !list) return;

  if (!ST_AUDIT || !ST_AUDIT.entries || ST_AUDIT.entries.length === 0) {
    list.innerHTML = '<p class="st-hint">Aucune exécution enregistrée.</p>';
    panel.style.display = '';
    return;
  }

  list.innerHTML = ST_AUDIT.entries.map(e => `
    <div class="st-audit-entry st-audit-${e.status}">
      <div class="st-audit-row">
        <span class="st-audit-status ${e.status === 'executed' ? 'st-audit-ok' : 'st-audit-fail'}">
          ${e.status === 'executed' ? '✅' : '✕'} ${e.status}
        </span>
        <span class="st-audit-time">${e.executedAt ? new Date(e.executedAt).toLocaleString() : '—'}</span>
      </div>
      <div class="st-audit-scene">${e.sceneName || '—'} <span class="st-id-masked">${e.sceneIdMasked}</span></div>
      ${e.reason ? `<div class="st-audit-reason">${e.reason}</div>` : ''}
      <div class="st-audit-meta">
        Audit : ${e.auditId || '—'} · Confirmation : ${e.confirmationUsed ? 'oui' : 'non'} · Token exposé : ${e.tokenExposed ? '⚠ oui' : 'non'}
      </div>
    </div>
  `).join('');

  panel.style.display = '';
}

/* =============================================
   PHASE 10 — COMMANDES TV CONTRÔLÉES
============================================= */

async function loadTvCommandPolicy() {
  try {
    const res = await fetchWithTimeout('/api/smartthings/tv/command-policy', 5000);
    if (res.ok) {
      TV_CMD_POLICY = await res.json();
      renderTvCommandPanel();
      if (TV_CMD_POLICY && TV_CMD_POLICY.enabled) {
        await loadAllowedTvDevices();
        await loadTvAudit();
      }
    }
  } catch { TV_CMD_POLICY = null; renderTvCommandPanel(); }
}

async function loadAllowedTvDevices() {
  try {
    const res = await fetchWithTimeout('/api/smartthings/tv/allowed-devices', 8000);
    if (res.ok) {
      TV_ALLOWED_DEVICES = await res.json();
      renderAllowedTvDevices();
    }
  } catch { TV_ALLOWED_DEVICES = null; }
}

async function loadTvCapabilities(deviceId) {
  try {
    const res = await fetchWithTimeout(`/api/smartthings/tv/${deviceId}/capabilities`, 8000);
    return res.ok ? await res.json() : null;
  } catch { return null; }
}

async function previewTvCommandUI(command) {
  const resultEl = document.getElementById('tvCmdPreviewResult');
  if (!resultEl) return;

  if (!TV_CURRENT_DEVICE_ID) {
    resultEl.style.display = '';
    resultEl.innerHTML = '<span class="tv-preview-warn">⚠ Aucune TV sélectionnée.</span>';
    return;
  }

  resultEl.style.display = '';
  resultEl.innerHTML = '<span class="tv-preview-loading">Prévisualisation…</span>';

  try {
    const res = await fetchWithTimeout(
      `/api/smartthings/tv/${TV_CURRENT_DEVICE_ID}/commands/preview`,
      6000,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command }) }
    );
    const data = await res.json();
    resultEl.innerHTML = `
      <div class="tv-preview-box">
        <div class="tv-preview-cmd">Commande : <strong>${data.command || command}</strong></div>
        <div class="tv-preview-allowed ${data.commandAllowed ? 'allowed' : 'blocked'}">
          ${data.commandAllowed ? '✅ Autorisée' : '✕ Non autorisée'}
          · TV allowlistée : ${data.deviceAllowlisted ? '✅' : '✕'}
        </div>
        ${data.wouldSend ? `<div class="tv-preview-payload"><pre>${JSON.stringify(data.wouldSend, null, 2)}</pre></div>` : ''}
        <div class="tv-preview-note">${data.message || ''}</div>
      </div>
    `;
    // Auto-remplir le select
    const sel = document.getElementById('tvCmdSelect');
    if (sel) sel.value = command;
  } catch {
    resultEl.innerHTML = '<span class="tv-preview-warn">Erreur de prévisualisation.</span>';
  }
}

async function executeTvCommandUI() {
  const command  = document.getElementById('tvCmdSelect')?.value;
  const code     = document.getElementById('tvCmdConfirmCode')?.value || '';
  const reason   = document.getElementById('tvCmdReason')?.value || '';
  const resultEl = document.getElementById('tvCmdResult');

  if (!command) {
    if (resultEl) { resultEl.style.display = ''; resultEl.innerHTML = '<div class="tv-cmd-result error">⚠ Sélectionnez une commande.</div>'; }
    return;
  }
  if (!TV_CURRENT_DEVICE_ID) {
    if (resultEl) { resultEl.style.display = ''; resultEl.innerHTML = '<div class="tv-cmd-result error">⚠ Aucune TV sélectionnée dans l\'allowlist.</div>'; }
    return;
  }

  if (resultEl) { resultEl.style.display = ''; resultEl.innerHTML = '<p class="loading-placeholder">Envoi de la commande…</p>'; }

  try {
    const res = await fetchWithTimeout(
      `/api/smartthings/tv/${TV_CURRENT_DEVICE_ID}/commands/execute`,
      12000,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, confirmationCode: code, reason }),
      }
    );
    const data = await res.json();

    if (data.success) {
      if (resultEl) resultEl.innerHTML = `
        <div class="tv-cmd-result success">
          <div class="tv-result-title">✅ Commande TV exécutée</div>
          <div class="tv-result-row"><span class="tv-result-label">TV</span><span>${data.deviceName || '—'} <span class="st-id-masked">${data.deviceId || ''}</span></span></div>
          <div class="tv-result-row"><span class="tv-result-label">Commande</span><span><strong>${data.command || command}</strong></span></div>
          <div class="tv-result-row"><span class="tv-result-label">Audit ID</span><span>${data.auditId || '—'}</span></div>
          <div class="tv-result-row"><span class="tv-result-label">Exécuté à</span><span>${data.executedAt ? new Date(data.executedAt).toLocaleTimeString() : '—'}</span></div>
          <div class="tv-result-warning">${data.securityWarning || ''}</div>
          <button class="btn-tv-result-close" onclick="closeTvCmdResult(); loadTvAudit();">Fermer et voir l'audit</button>
        </div>
      `;
    } else {
      if (resultEl) resultEl.innerHTML = `
        <div class="tv-cmd-result error">
          <div class="tv-result-title">✕ Commande refusée</div>
          <div class="tv-result-error">${data.error || data.message || 'Erreur inconnue'}</div>
          <button class="btn-tv-result-close" onclick="closeTvCmdResult()">Fermer</button>
        </div>
      `;
    }
    await loadTvAudit();
  } catch {
    if (resultEl) resultEl.innerHTML = `
      <div class="tv-cmd-result error">
        <div class="tv-result-title">✕ Erreur réseau</div>
        <div class="tv-result-error">Impossible de contacter le serveur.</div>
        <button class="btn-tv-result-close" onclick="closeTvCmdResult()">Fermer</button>
      </div>
    `;
  }
}

function closeTvCmdResult() {
  const el = document.getElementById('tvCmdResult');
  if (el) { el.style.display = 'none'; el.innerHTML = ''; }
}

async function loadTvAudit() {
  try {
    const res = await fetchWithTimeout('/api/smartthings/tv/audit', 5000);
    if (res.ok) {
      TV_AUDIT = await res.json();
      renderTvAudit();
    }
  } catch { TV_AUDIT = null; }
}

async function clearTvAudit() {
  try {
    const res = await fetchWithTimeout('/api/smartthings/tv/audit', 5000, { method: 'DELETE' });
    if (res.ok) {
      TV_AUDIT = { count: 0, entries: [] };
      renderTvAudit();
    }
  } catch { /* silencieux */ }
}

function renderTvCommandPanel() {
  const panel   = document.getElementById('stTvCommandPanel');
  const content = document.getElementById('tvCmdPolicyContent');
  if (!panel || !content) return;

  if (!TV_CMD_POLICY) {
    content.innerHTML = '<p class="st-hint">Politique non chargée. Lancez le serveur et cliquez "📺 Commandes TV".</p>';
    panel.style.display = '';
    return;
  }

  const p = TV_CMD_POLICY;
  const cmdList = (p.commandAllowlist || []).join(', ') || 'Aucune';

  content.innerHTML = `
    <div class="tv-cmd-policy-grid">
      <div class="tv-cmd-policy-item">
        <span class="tv-cmd-policy-label">Commandes TV activées</span>
        <span class="tv-cmd-badge ${p.enabled ? 'tv-badge-on' : 'tv-badge-off'}">
          ${p.enabled ? '✅ Activées' : '🔒 Désactivées'}
        </span>
      </div>
      <div class="tv-cmd-policy-item">
        <span class="tv-cmd-policy-label">Confirmation requise</span>
        <span class="tv-cmd-badge ${p.confirmationRequired ? 'tv-badge-on' : 'tv-badge-warn'}">
          ${p.confirmationRequired ? '✅ Oui' : '⚠ Non'}
        </span>
      </div>
      <div class="tv-cmd-policy-item">
        <span class="tv-cmd-policy-label">TV allowlistées</span>
        <span class="tv-cmd-badge ${p.deviceAllowlistCount > 0 ? 'tv-badge-on' : 'tv-badge-off'}">
          ${p.deviceAllowlistCount > 0 ? `✅ ${p.deviceAllowlistCount} TV` : '✕ Aucune'}
        </span>
      </div>
      <div class="tv-cmd-policy-item">
        <span class="tv-cmd-policy-label">Audit TV</span>
        <span class="tv-cmd-badge ${p.auditEnabled ? 'tv-badge-on' : 'tv-badge-off'}">
          ${p.auditEnabled ? '✅ Actif' : '✕ Désactivé'}
        </span>
      </div>
      <div class="tv-cmd-policy-item">
        <span class="tv-cmd-policy-label">Volume</span>
        <span class="tv-cmd-badge tv-badge-blocked">🔒 ${p.blockedCommandFamilies?.volume ? 'Bloqué' : 'Autorisé'}</span>
      </div>
      <div class="tv-cmd-policy-item">
        <span class="tv-cmd-policy-label">Keypad / Source</span>
        <span class="tv-cmd-badge tv-badge-blocked">🔒 Bloqués</span>
      </div>
    </div>
    <div class="tv-cmd-allowlist-row">
      <span class="tv-cmd-allowlist-label">Commandes autorisées :</span>
      <span class="tv-cmd-allowlist-vals">${cmdList}</span>
    </div>
    ${!p.enabled ? '<div class="tv-cmd-hint">Pour activer : <code>SMARTTHINGS_TV_COMMANDS_ENABLED=true</code> + <code>SMARTTHINGS_TV_DEVICE_ALLOWLIST=&lt;tv-device-id&gt;</code></div>' : ''}
  `;

  panel.style.display = '';

  // Charger l'audit TV si activé
  if (p.auditEnabled) {
    const auditPanel = document.getElementById('stTvAuditPanel');
    if (auditPanel) auditPanel.style.display = '';
    loadTvAudit();
  }
}

function renderAllowedTvDevices() {
  const block = document.getElementById('tvAllowedDevicesBlock');
  const list  = document.getElementById('tvAllowedDevicesList');
  const execBlock = document.getElementById('tvCmdExecuteBlock');
  if (!block || !list) return;

  const data = TV_ALLOWED_DEVICES;
  if (!data || data.status === 'disabled' || data.status === 'no_allowlist') {
    list.innerHTML = `<p class="st-hint">${data?.message || 'Aucune TV allowlistée.'}</p>`;
    block.style.display = '';
    return;
  }

  if (!data.devices || data.devices.length === 0) {
    list.innerHTML = '<p class="st-hint">Aucune TV de l\'allowlist trouvée dans SmartThings.</p>';
    block.style.display = '';
    return;
  }

  list.innerHTML = data.devices.map((d, i) => `
    <div class="tv-device-card ${i === 0 ? 'tv-device-selected' : ''}" onclick="selectTvDevice('${d.deviceIdRaw}', this)">
      <div class="tv-device-name">${d.label || d.name || 'TV Samsung'}</div>
      <div class="tv-device-meta">Type : ${d.type || '—'}</div>
      <div class="tv-device-id">ID : <span class="st-id-masked">${d.deviceId || '—'}</span> 🔒</div>
      <div class="tv-device-restricted">🔒 TV uniquement · ${d.allowedCommands?.length || 0} commande(s)</div>
    </div>
  `).join('');

  // Sélectionner la première TV par défaut
  if (data.devices.length > 0 && data.devices[0].deviceIdRaw) {
    TV_CURRENT_DEVICE_ID = data.devices[0].deviceIdRaw;
    if (execBlock) execBlock.style.display = '';
  }

  block.style.display = '';
}

function selectTvDevice(deviceIdRaw, el) {
  TV_CURRENT_DEVICE_ID = deviceIdRaw;
  // Mettre à jour la sélection visuelle
  document.querySelectorAll('.tv-device-card').forEach(c => c.classList.remove('tv-device-selected'));
  if (el) el.classList.add('tv-device-selected');
  const execBlock = document.getElementById('tvCmdExecuteBlock');
  if (execBlock) execBlock.style.display = '';
}

function renderTvAudit() {
  const panel = document.getElementById('stTvAuditPanel');
  const list  = document.getElementById('tvAuditList');
  if (!panel || !list) return;

  if (!TV_AUDIT || !TV_AUDIT.entries || TV_AUDIT.entries.length === 0) {
    list.innerHTML = '<p class="st-hint">Aucune commande TV enregistrée.</p>';
    panel.style.display = '';
    return;
  }

  list.innerHTML = TV_AUDIT.entries.map(e => `
    <div class="st-audit-entry st-audit-${e.status}">
      <div class="st-audit-row">
        <span class="st-audit-status ${e.status === 'executed' ? 'st-audit-ok' : 'st-audit-fail'}">
          ${e.status === 'executed' ? '✅' : '✕'} ${e.status}
        </span>
        <span class="st-audit-time">${e.executedAt ? new Date(e.executedAt).toLocaleString() : '—'}</span>
      </div>
      <div class="st-audit-scene">
        <strong>${e.command || '—'}</strong>
        · TV : ${e.deviceName || '—'} <span class="st-id-masked">${e.deviceIdMasked || ''}</span>
      </div>
      ${e.reason ? `<div class="st-audit-reason">${e.reason}</div>` : ''}
      <div class="st-audit-meta">
        Audit : ${e.auditId || '—'} · Confirmation : ${e.confirmationUsed ? 'oui' : 'non'}
        · Token exposé : ${e.tokenExposed ? '⚠ oui' : 'non'} · Restreint TV : ${e.restrictedToTv ? 'oui' : '?'}
      </div>
    </div>
  `).join('');

  panel.style.display = '';
}

/* ===============================================
   PHASE 11 — Streaming assisté
=============================================== */

let STREAMING_POLICY    = null;
let STREAMING_RENDERERS = null;
let STREAMING_ITEMS     = [];
let STREAMING_QUEUE     = null;
let STREAMING_AUDIT     = null;
let STREAMING_SELECTED_MEDIA_ID   = null;
let STREAMING_SELECTED_MEDIA_TITLE = null;

/* ── loadStreamingPolicy ─────────────────── */
async function loadStreamingPolicy() {
  try {
    const res = await fetch('/api/streaming/policy');
    STREAMING_POLICY = await res.json();
  } catch {
    STREAMING_POLICY = { status: 'error', message: 'Backend non disponible.' };
  }
  renderStreamingPolicyPanel();
  showStreamingPanel('streamingPolicyPanel');
  hideStreamingInit();
}

function renderStreamingPolicyPanel() {
  const el = document.getElementById('streamingPolicyContent');
  if (!el) return;
  const p = STREAMING_POLICY || {};
  if (p.status === 'disabled') {
    el.innerHTML = `<div class="streaming-policy-disabled">⚠ ${p.message || 'Streaming désactivé'}</div>`;
    return;
  }
  const s = p.streaming || {};
  const d = p.dlna || {};
  el.innerHTML = `
    <div class="streaming-policy-grid">
      <div class="streaming-policy-item">
        <span class="sp-label">Streaming global</span>
        <span class="sp-badge ${s.enabled ? 'badge-on' : 'badge-off'}">${s.enabled ? 'Activé' : 'Désactivé'}</span>
      </div>
      <div class="streaming-policy-item">
        <span class="sp-label">Confirmation requise</span>
        <span class="sp-badge ${s.requireConfirmation ? 'badge-warn' : 'badge-off'}">${s.requireConfirmation ? 'Oui' : 'Non'}</span>
      </div>
      <div class="streaming-policy-item">
        <span class="sp-label">DLNA streaming</span>
        <span class="sp-badge ${d.streamingEnabled ? 'badge-on' : 'badge-off'}">${d.streamingEnabled ? 'Activé' : 'Désactivé'}</span>
      </div>
      <div class="streaming-policy-item">
        <span class="sp-label">Renderers autorisés</span>
        <span class="sp-badge ${d.rendererAllowlistEmpty ? 'badge-warn' : 'badge-on'}">${d.rendererAllowlistCount || 0} configurés</span>
      </div>
      <div class="streaming-policy-item">
        <span class="sp-label">Extensions autorisées</span>
        <span class="sp-ext">${(s.allowedExtensions || []).join(', ') || '—'}</span>
      </div>
      <div class="streaming-policy-item">
        <span class="sp-label">Taille max</span>
        <span class="sp-value">${s.maxFileMb || '—'} Mo</span>
      </div>
      <div class="streaming-policy-item">
        <span class="sp-label">Audit</span>
        <span class="sp-badge ${s.auditEnabled ? 'badge-on' : 'badge-off'}">${s.auditEnabled ? 'Activé' : 'Désactivé'}</span>
      </div>
      <div class="streaming-policy-item">
        <span class="sp-label">Autoplay scénarios</span>
        <span class="sp-badge badge-blocked">${d.blockAutoplayInScenarios ? 'Bloqué' : 'Autorisé'}</span>
      </div>
    </div>
    <div class="streaming-policy-note">${p.securityNote || ''}</div>
    <div class="streaming-policy-actions">
      <button class="btn-streaming-action" onclick="loadAllowedRenderersUI()">📡 Voir renderers autorisés</button>
    </div>
  `;
}

/* ── loadMediaLibraryStatus ──────────────── */
async function loadMediaLibraryStatus() {
  try {
    const res = await fetch('/api/streaming/library/status');
    return await res.json();
  } catch {
    return { status: 'error', message: 'Backend non disponible.' };
  }
}

/* ── scanMediaLibrary ────────────────────── */
async function scanMediaLibrary() {
  showStreamingPanel('streamingLibraryPanel');
  hideStreamingInit();

  const statusEl = document.getElementById('streamingLibraryStatus');
  const gridEl   = document.getElementById('streamingLibraryGrid');
  if (statusEl) statusEl.innerHTML = '<p class="streaming-loading">Scan en cours…</p>';
  if (gridEl)   gridEl.innerHTML   = '';

  try {
    const res = await fetch('/api/streaming/library/scan', { method: 'POST' });
    const scanResult = await res.json();

    if (scanResult.status === 'error') {
      if (statusEl) statusEl.innerHTML = `<div class="streaming-error">✕ ${scanResult.message || 'Erreur lors du scan.'}</div>`;
      return;
    }

    await loadMediaItems();
    if (statusEl) {
      statusEl.innerHTML = `
        <div class="streaming-scan-result">
          ✓ ${scanResult.itemCount || 0} média(s) trouvé(s)
          <span class="streaming-scan-time">· ${new Date(scanResult.lastScanAt || Date.now()).toLocaleTimeString()}</span>
        </div>`;
    }
  } catch {
    if (statusEl) statusEl.innerHTML = '<div class="streaming-error">✕ Erreur de communication avec le serveur.</div>';
  }
}

/* ── loadMediaItems ──────────────────────── */
async function loadMediaItems() {
  try {
    const res = await fetch('/api/streaming/library/items');
    const data = await res.json();
    STREAMING_ITEMS = (data.items || []);
    renderMediaLibrary();
  } catch {
    STREAMING_ITEMS = [];
  }
}

function renderMediaLibrary() {
  const gridEl = document.getElementById('streamingLibraryGrid');
  if (!gridEl) return;

  if (!STREAMING_ITEMS.length) {
    gridEl.innerHTML = '<p class="streaming-empty">Aucun média dans la bibliothèque. Configurez MEDIA_STREAMING_ALLOWED_DIR et scannez.</p>';
    return;
  }

  const typeIcons = { video: '🎬', audio: '🎵', image: '🖼', unknown: '📄' };

  gridEl.innerHTML = STREAMING_ITEMS.map(item => `
    <div class="streaming-media-card streaming-type-${item.type}" data-id="${item.id}">
      <div class="smc-icon">${typeIcons[item.type] || '📄'}</div>
      <div class="smc-info">
        <div class="smc-title">${escHtml(item.title || '—')}</div>
        <div class="smc-meta">
          <span class="smc-ext">${escHtml(item.extension || '')}</span>
          <span class="smc-size">${item.sizeMb || 0} Mo</span>
          <span class="smc-type streaming-badge-${item.type}">${item.type}</span>
        </div>
      </div>
      <div class="smc-actions">
        <button class="btn-smc-queue" onclick="addMediaToQueueUI('${item.id}', '${escHtml(item.title || '')}')">+ File</button>
        <button class="btn-smc-play"  onclick="selectMediaForPlay('${item.id}', '${escHtml(item.title || '')}')">▶ Lire</button>
      </div>
    </div>
  `).join('');
}

/* ── selectMediaForPlay ──────────────────── */
function selectMediaForPlay(mediaId, title) {
  STREAMING_SELECTED_MEDIA_ID    = mediaId;
  STREAMING_SELECTED_MEDIA_TITLE = title;

  const el = document.getElementById('streamingSelectedMedia');
  if (el) el.textContent = title || mediaId;

  showStreamingPanel('streamingPlayPanel');
  loadAllowedRenderersUI();
}

/* ── loadAllowedRenderersUI ──────────────── */
async function loadAllowedRenderersUI() {
  try {
    const res = await fetch('/api/streaming/renderers');
    STREAMING_RENDERERS = await res.json();
  } catch {
    STREAMING_RENDERERS = { status: 'error', renderers: [] };
  }
  renderStreamingRenderers();
  showStreamingPanel('streamingRenderersPanel');
}

function renderStreamingRenderers() {
  const listEl   = document.getElementById('streamingRenderersList');
  const selectEl = document.getElementById('streamingRendererSelect');
  const data     = STREAMING_RENDERERS || {};

  if (listEl) {
    if (!data.renderers || data.renderers.length === 0) {
      listEl.innerHTML = `<p class="streaming-empty">Aucun renderer autorisé. Configurez DLNA_RENDERER_ALLOWLIST dans .env.</p>`;
    } else {
      listEl.innerHTML = data.renderers.map(r => `
        <div class="streaming-renderer-card">
          <span class="src-name">${escHtml(r.name || '—')}</span>
          <span class="src-id">${escHtml(r.rendererId || '—')}</span>
          <span class="src-status streaming-discovery-${r.discoveryStatus}">${r.discoveryStatus === 'discovered' ? '✓ Détecté' : '⟳ Non encore découvert'}</span>
        </div>
      `).join('');
    }
  }

  if (selectEl) {
    const opts = (data.renderers || []).map(r =>
      `<option value="${escHtml(r.rendererIdRaw || r.rendererId || '')}">${escHtml(r.name || r.rendererId || '—')}</option>`
    );
    selectEl.innerHTML = '<option value="">— Sélectionner un renderer —</option>' + opts.join('');
  }
}

/* ── previewStreamingUI ──────────────────── */
async function previewStreamingUI() {
  const mediaId    = STREAMING_SELECTED_MEDIA_ID;
  const rendererId = document.getElementById('streamingRendererSelect')?.value;
  const resultEl   = document.getElementById('streamingPreviewResult');

  if (!mediaId)    { if (resultEl) { resultEl.style.display = ''; resultEl.innerHTML = '<div class="streaming-error">Sélectionnez d\'abord un média.</div>'; } return; }
  if (!rendererId) { if (resultEl) { resultEl.style.display = ''; resultEl.innerHTML = '<div class="streaming-error">Sélectionnez un renderer.</div>'; } return; }

  if (resultEl) { resultEl.style.display = ''; resultEl.innerHTML = '<p class="streaming-loading">Prévisualisation…</p>'; }

  try {
    const res  = await fetch('/api/streaming/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId, rendererId }),
    });
    const data = await res.json();
    if (resultEl) {
      resultEl.innerHTML = data.valid
        ? `<div class="streaming-preview-ok">
             ✓ Prévisualisation valide<br>
             <strong>${escHtml(data.title || '—')}</strong> · ${escHtml(data.type || '')} · ${data.sizeMb || 0} Mo<br>
             Renderer : ${escHtml(data.rendererMasked || '—')}<br>
             ${data.requiresConfirmation ? `Code requis : <code>${escHtml(data.confirmationCode || '')}</code>` : ''}
           </div>`
        : `<div class="streaming-error">✕ ${escHtml(data.reason || 'Prévisualisation refusée.')}</div>`;
    }
  } catch {
    if (resultEl) resultEl.innerHTML = '<div class="streaming-error">✕ Erreur serveur.</div>';
  }
}

/* ── playStreamingUI ─────────────────────── */
async function playStreamingUI() {
  const mediaId      = STREAMING_SELECTED_MEDIA_ID;
  const rendererId   = document.getElementById('streamingRendererSelect')?.value;
  const confirmation = document.getElementById('streamingConfirmCode')?.value?.trim();
  const resultEl     = document.getElementById('streamingPlayResult');

  if (!mediaId)      { if (resultEl) { resultEl.style.display = ''; resultEl.innerHTML = '<div class="streaming-error">Sélectionnez un média.</div>'; } return; }
  if (!rendererId)   { if (resultEl) { resultEl.style.display = ''; resultEl.innerHTML = '<div class="streaming-error">Sélectionnez un renderer.</div>'; } return; }
  if (!confirmation) { if (resultEl) { resultEl.style.display = ''; resultEl.innerHTML = '<div class="streaming-error">Code de confirmation requis.</div>'; } return; }

  if (resultEl) { resultEl.style.display = ''; resultEl.innerHTML = '<p class="streaming-loading">Validation en cours…</p>'; }

  try {
    const res  = await fetch('/api/streaming/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId, rendererId, confirmation }),
    });
    const data = await res.json();

    if (resultEl) {
      if (data.status === 'instructed') {
        const steps = (data.instructions || []).map((s, i) => `<li>${i + 1}. ${escHtml(s)}</li>`).join('');
        resultEl.innerHTML = `
          <div class="streaming-play-ok">
            ✓ Streaming assisté prêt · Mode : ${escHtml(data.mode || 'assisted')}<br>
            <strong>${escHtml(data.media?.title || '—')}</strong> → ${escHtml(data.rendererMasked || '—')}<br>
            <strong>Instructions :</strong><ol class="streaming-instructions">${steps}</ol>
            <div class="streaming-note">${escHtml(data.note || '')}</div>
            <div class="streaming-audit-ref">Audit : ${escHtml(data.auditId || '—')}</div>
          </div>`;
      } else {
        resultEl.innerHTML = `<div class="streaming-error">✕ ${escHtml(data.reason || 'Lecture refusée.')}</div>`;
      }
    }
  } catch {
    if (resultEl) resultEl.innerHTML = '<div class="streaming-error">✕ Erreur serveur.</div>';
  }
}

/* ── loadPlayQueue ───────────────────────── */
async function loadPlayQueue() {
  try {
    const res = await fetch('/api/streaming/queue');
    STREAMING_QUEUE = await res.json();
  } catch {
    STREAMING_QUEUE = { items: [], summary: {} };
  }
  renderPlayQueuePanel();
  showStreamingPanel('streamingQueuePanel');
  hideStreamingInit();
}

function renderPlayQueuePanel() {
  const listEl    = document.getElementById('streamingQueueList');
  const summaryEl = document.getElementById('streamingQueueSummary');
  const items     = (STREAMING_QUEUE && STREAMING_QUEUE.items) || [];
  const summary   = (STREAMING_QUEUE && STREAMING_QUEUE.summary) || {};

  if (listEl) {
    if (!items.length) {
      listEl.innerHTML = '<p class="streaming-empty">File de lecture vide. Ajoutez des médias depuis la médiathèque.</p>';
    } else {
      const typeIcons = { video: '🎬', audio: '🎵', image: '🖼', unknown: '📄' };
      listEl.innerHTML = items.map((item, i) => `
        <div class="streaming-queue-item">
          <span class="sqi-pos">#${i + 1}</span>
          <span class="sqi-icon">${typeIcons[item.type] || '📄'}</span>
          <span class="sqi-title">${escHtml(item.title || '—')}</span>
          <span class="sqi-meta">${escHtml(item.extension || '')} · ${item.sizeMb || 0} Mo</span>
          <span class="sqi-status">${escHtml(item.status || 'queued')}</span>
          <div class="sqi-actions">
            <button class="btn-sqi-up"   onclick="moveQueueItemUI('${item.queueItemId}', 'up')">↑</button>
            <button class="btn-sqi-down" onclick="moveQueueItemUI('${item.queueItemId}', 'down')">↓</button>
            <button class="btn-sqi-play" onclick="selectMediaForPlay('${escHtml(item.mediaId || '')}', '${escHtml(item.title || '')}')">▶</button>
            <button class="btn-sqi-rm"   onclick="removeFromQueueUI('${item.queueItemId}')">✕</button>
          </div>
        </div>
      `).join('');
    }
  }

  if (summaryEl) {
    summaryEl.innerHTML = summary.totalItems !== undefined
      ? `Total : ${summary.totalItems} élément(s) · ${summary.totalMb || 0} Mo · 🎬 ${summary.byType?.video || 0} · 🎵 ${summary.byType?.audio || 0} · 🖼 ${summary.byType?.image || 0}`
      : '';
  }
}

/* ── addMediaToQueueUI ───────────────────── */
async function addMediaToQueueUI(mediaId, title) {
  try {
    const res  = await fetch('/api/streaming/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mediaId }),
    });
    const data = await res.json();
    if (data.success) {
      await loadPlayQueue();
    } else {
      alert(`Impossible d'ajouter à la file : ${data.error || '—'}`);
    }
  } catch {
    alert('Erreur serveur lors de l\'ajout à la file.');
  }
}

/* ── removeFromQueueUI ───────────────────── */
async function removeFromQueueUI(queueItemId) {
  try {
    await fetch(`/api/streaming/queue/${encodeURIComponent(queueItemId)}`, { method: 'DELETE' });
    await loadPlayQueue();
  } catch {
    alert('Erreur lors de la suppression.');
  }
}

/* ── clearPlayQueueUI ────────────────────── */
async function clearPlayQueueUI() {
  if (!confirm('Vider toute la file de lecture ?')) return;
  try {
    await fetch('/api/streaming/queue', { method: 'DELETE' });
    await loadPlayQueue();
  } catch {
    alert('Erreur lors de la suppression.');
  }
}

/* ── moveQueueItemUI ─────────────────────── */
async function moveQueueItemUI(queueItemId, direction) {
  try {
    await fetch(`/api/streaming/queue/${encodeURIComponent(queueItemId)}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction }),
    });
    await loadPlayQueue();
  } catch { /* silencieux */ }
}

/* ── loadStreamingAudit ──────────────────── */
async function loadStreamingAudit() {
  try {
    const res = await fetch('/api/streaming/audit');
    STREAMING_AUDIT = await res.json();
  } catch {
    STREAMING_AUDIT = { entries: [] };
  }
  renderStreamingAuditPanel();
  showStreamingPanel('streamingAuditPanel');
  hideStreamingInit();
}

function renderStreamingAuditPanel() {
  const listEl = document.getElementById('streamingAuditList');
  if (!listEl) return;
  const entries = (STREAMING_AUDIT && STREAMING_AUDIT.entries) || [];

  if (!entries.length) {
    listEl.innerHTML = '<p class="streaming-empty">Aucune entrée d\'audit streaming.</p>';
    return;
  }

  listEl.innerHTML = entries.map(e => `
    <div class="streaming-audit-entry streaming-audit-${e.status}">
      <div class="sae-row">
        <span class="sae-status ${e.status === 'instructed' ? 'sae-ok' : 'sae-fail'}">
          ${e.status === 'instructed' ? '✓' : '✕'} ${escHtml(e.status || '—')}
        </span>
        <span class="sae-time">${e.executedAt ? new Date(e.executedAt).toLocaleString() : (e.requestedAt ? new Date(e.requestedAt).toLocaleString() : '—')}</span>
      </div>
      <div class="sae-media">
        <strong>${escHtml(e.mediaTitle || '—')}</strong>
        · ${escHtml(e.mediaType || '')} · Renderer : ${escHtml(e.rendererIdMasked || '—')}
      </div>
      ${e.reason ? `<div class="sae-reason">${escHtml(e.reason)}</div>` : ''}
      <div class="sae-meta">
        Audit : ${escHtml(e.auditId || '—')} · Mode : ${escHtml(e.mode || '—')}
        · Confirmation : ${e.confirmationUsed ? 'oui' : 'non'}
        · Chemin exposé : ${e.filePathExposed ? '⚠ oui' : 'non'}
      </div>
    </div>
  `).join('');
}

/* ── clearStreamingAuditUI ───────────────── */
async function clearStreamingAuditUI() {
  if (!confirm('Vider l\'historique streaming ?')) return;
  try {
    await fetch('/api/streaming/audit', { method: 'DELETE' });
    await loadStreamingAudit();
  } catch {
    alert('Erreur lors de la suppression.');
  }
}

/* ── Helpers d'affichage panels ──────────── */
const STREAMING_PANELS = [
  'streamingPolicyPanel', 'streamingLibraryPanel', 'streamingRenderersPanel',
  'streamingPlayPanel', 'streamingQueuePanel', 'streamingAuditPanel',
];

function showStreamingPanel(panelId) {
  const el = document.getElementById(panelId);
  if (el) el.style.display = '';
}

function hideStreamingInit() {
  const el = document.getElementById('streamingInitPanel');
  if (el) el.style.display = 'none';
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ===============================================
   PHASE 12 — Notifications locales
=============================================== */

let NOTIF_FILTER_TYPE  = '';
let NOTIF_FILTER_LEVEL = '';
let NOTIF_POLL_INTERVAL = null;
let NOTIF_BROWSER_PERMISSION = 'default'; // 'default' | 'granted' | 'denied'

/* ── loadNotifications ───────────────────── */
async function loadNotifications() {
  const unreadOnly = document.getElementById('notifUnreadOnly')?.checked;
  const params = new URLSearchParams();
  if (NOTIF_FILTER_TYPE)  params.set('type',  NOTIF_FILTER_TYPE);
  if (NOTIF_FILTER_LEVEL) params.set('level', NOTIF_FILTER_LEVEL);
  if (unreadOnly)         params.set('unreadOnly', 'true');
  params.set('limit', '50');

  try {
    const res  = await fetch(`/api/notifications?${params.toString()}`);
    const data = await res.json();
    renderNotificationsPanel(data.items || []);
    await loadNotificationStats();
  } catch {
    const el = document.getElementById('notifList');
    if (el) el.innerHTML = '<p class="notif-error">Backend non disponible.</p>';
  }
}

/* ── loadNotificationStats ───────────────── */
async function loadNotificationStats() {
  try {
    const res  = await fetch('/api/notifications/stats');
    const data = await res.json();
    renderNotificationStats(data);
    updateNavNotifBadge(data.unread || 0);
  } catch { /* silencieux */ }
}

function renderNotificationStats(stats) {
  const badge = document.getElementById('notifUnreadBadge');
  if (badge) badge.textContent = `${stats.unread || 0} non lu(s) · ${stats.total || 0} total`;

  const panel   = document.getElementById('notifStatsPanel');
  const content = document.getElementById('notifStatsContent');
  if (!panel || !content) return;

  const byType  = stats.byType  || {};
  const byLevel = stats.byLevel || {};

  const typeItems  = Object.entries(byType).map(([k, v])  => `<span class="nss-item"><strong>${v}</strong> ${k}</span>`).join('');
  const levelItems = Object.entries(byLevel).map(([k, v]) => `<span class="nss-item nss-${k}"><strong>${v}</strong> ${k}</span>`).join('');

  content.innerHTML = `
    <div class="nss-row">${typeItems || '<span class="nss-empty">—</span>'}</div>
    <div class="nss-row">${levelItems || '<span class="nss-empty">—</span>'}</div>
    ${stats.lastNotificationAt ? `<div class="nss-last">Dernière : ${new Date(stats.lastNotificationAt).toLocaleString()}</div>` : ''}
  `;
  panel.style.display = '';
}

function updateNavNotifBadge(count) {
  const el = document.getElementById('navNotifBadge');
  if (!el) return;
  if (count > 0) {
    el.textContent = count > 99 ? '99+' : count;
    el.style.display = '';
  } else {
    el.style.display = 'none';
  }
}

/* ── renderNotificationsPanel ────────────── */
function renderNotificationsPanel(items) {
  const el = document.getElementById('notifList');
  if (!el) return;

  if (!items.length) {
    el.innerHTML = '<p class="notif-empty">Aucune notification. Les événements du système apparaîtront ici.</p>';
    return;
  }

  const levelIcons = { info: 'ℹ', success: '✓', warning: '⚠', error: '✕', security: '🔒' };

  el.innerHTML = items.map(n => `
    <div class="notif-card notif-level-${n.level} ${n.read ? 'notif-read' : 'notif-unread'}" data-id="${n.id}">
      <div class="notif-card-header">
        <span class="notif-icon notif-icon-${n.level}">${levelIcons[n.level] || 'ℹ'}</span>
        <span class="notif-title">${escHtml(n.title || '—')}</span>
        <span class="notif-type-badge notif-type-${n.type}">${escHtml(n.type || '')}</span>
        <span class="notif-time">${n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : '—'}</span>
        <div class="notif-card-actions">
          ${!n.read ? `<button class="btn-notif-read" title="Marquer comme lu" onclick="markNotificationRead('${n.id}')">✓</button>` : ''}
          <button class="btn-notif-delete" title="Supprimer" onclick="deleteNotificationUI('${n.id}')">✕</button>
        </div>
      </div>
      ${n.message ? `<div class="notif-message">${escHtml(n.message)}</div>` : ''}
      <div class="notif-meta">
        ${new Date(n.createdAt || 0).toLocaleDateString()} · ${escHtml(n.source || 'Sallon-ConnecT')}
        ${n.sensitiveDataMasked ? ' · <span class="notif-masked-badge">données masquées</span>' : ''}
      </div>
    </div>
  `).join('');
}

/* ── createTestNotification ──────────────── */
async function createTestNotification() {
  try {
    const res = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'system', level: 'info',
        title: 'Notification de test',
        message: 'Sallon-ConnecT Phase 12 — notification locale OK',
      }),
    });
    const data = await res.json();
    if (data.success) {
      await loadNotifications();
      if (NOTIF_BROWSER_PERMISSION === 'granted') {
        showBrowserNotification(data.notification);
      }
    } else {
      alert(data.error || 'Notification dupliquée — réessayez dans quelques secondes.');
    }
  } catch {
    alert('Erreur serveur.');
  }
}

/* ── markNotificationRead ────────────────── */
async function markNotificationRead(id) {
  try {
    await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
    await loadNotifications();
  } catch { /* silencieux */ }
}

/* ── markAllNotificationsRead ────────────── */
async function markAllNotificationsRead() {
  try {
    await fetch('/api/notifications/read-all', { method: 'PATCH' });
    await loadNotifications();
  } catch { /* silencieux */ }
}

/* ── deleteNotificationUI ────────────────── */
async function deleteNotificationUI(id) {
  try {
    await fetch(`/api/notifications/${encodeURIComponent(id)}`, { method: 'DELETE' });
    await loadNotifications();
  } catch { /* silencieux */ }
}

/* ── clearNotifications ──────────────────── */
async function clearNotifications() {
  if (!confirm('Vider toutes les notifications ?')) return;
  try {
    await fetch('/api/notifications', { method: 'DELETE' });
    await loadNotifications();
  } catch { /* silencieux */ }
}

/* ── setNotifFilter ──────────────────────── */
function setNotifFilter(filterKey, value, btn) {
  if (filterKey === 'type')  NOTIF_FILTER_TYPE  = value;
  if (filterKey === 'level') NOTIF_FILTER_LEVEL = value;

  /* Mise à jour des boutons actifs */
  const selector = filterKey === 'type' ? '.btn-notif-filter' : '.btn-notif-level';
  document.querySelectorAll(selector).forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  loadNotifications();
}

/* ── requestBrowserNotificationPermission ── */
async function requestBrowserNotificationPermission() {
  if (!('Notification' in window)) {
    alert('Les notifications navigateur ne sont pas supportées par ce navigateur.');
    return;
  }
  if (Notification.permission === 'granted') {
    NOTIF_BROWSER_PERMISSION = 'granted';
    const btn = document.getElementById('btnBrowserNotif');
    if (btn) { btn.textContent = '✓ Notifications navigateur activées'; btn.disabled = true; }
    return;
  }
  if (Notification.permission === 'denied') {
    alert('Les notifications navigateur ont été bloquées. Autorisez-les dans les paramètres de votre navigateur.');
    return;
  }
  /* Demander la permission uniquement sur action explicite */
  const permission = await Notification.requestPermission();
  NOTIF_BROWSER_PERMISSION = permission;
  const btn = document.getElementById('btnBrowserNotif');
  if (permission === 'granted') {
    if (btn) { btn.textContent = '✓ Notifications navigateur activées'; btn.disabled = true; }
  } else {
    if (btn) btn.textContent = '🔔 Activer notifications navigateur';
  }
}

/* ── showBrowserNotification ─────────────── */
function showBrowserNotification(notification) {
  if (!notification) return;
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    /* Jamais de données sensibles dans la notification navigateur */
    new Notification(String(notification.title || 'Sallon-ConnecT').substring(0, 100), {
      body: String(notification.message || '').substring(0, 200),
      icon: '/assets/img/icon.png',
      tag:  notification.id || 'sallon-connect',
    });
  } catch { /* Fallback silencieux */ }
}

/* ── pollNotifications ───────────────────── */
function pollNotifications() {
  if (NOTIF_POLL_INTERVAL) clearInterval(NOTIF_POLL_INTERVAL);
  NOTIF_POLL_INTERVAL = setInterval(async () => {
    try {
      await loadNotificationStats();
    } catch { /* silencieux */ }
  }, 15000);
}

/* ── Initialisation badge navigateur ──────── */
function initBrowserNotifButton() {
  if (!('Notification' in window)) {
    const btn = document.getElementById('btnBrowserNotif');
    if (btn) { btn.textContent = '🔔 Non supporté'; btn.disabled = true; }
    return;
  }
  if (Notification.permission === 'granted') {
    NOTIF_BROWSER_PERMISSION = 'granted';
    const btn = document.getElementById('btnBrowserNotif');
    if (btn) { btn.textContent = '✓ Notifications navigateur activées'; btn.disabled = true; }
  }
}

/* ===============================================
   PHASE 13 — Tâches planifiées (Scheduler)
=============================================== */

let SCHED_DATA     = null;
let SCHED_ACTIONS  = null;
let SCHED_HISTORY  = null;

/* ── loadSchedulerStatus ─────────────────── */
async function loadSchedulerStatus() {
  try {
    const res  = await fetch('/api/scheduler/status');
    SCHED_DATA = await res.json();
  } catch {
    SCHED_DATA = { status: 'error', message: 'Backend non disponible.' };
  }
  renderSchedulerPanel();
}

function renderSchedulerPanel() {
  const bar = document.getElementById('schedStatusBar');
  if (!bar || !SCHED_DATA) return;
  const d = SCHED_DATA;
  const statusClass = d.status === 'running' ? 'sched-running' : (d.status === 'stopped' ? 'sched-stopped' : 'sched-error');
  bar.innerHTML = `
    <div class="sched-status-row">
      <span class="sched-status-badge ${statusClass}">${d.status === 'running' ? '▶ Actif' : (d.status === 'stopped' ? '⏹ Arrêté' : '— Désactivé')}</span>
      <span class="sched-stat">Tâches actives : <strong>${d.activeSchedules || 0}</strong>/${d.totalSchedules || 0}</span>
      <span class="sched-stat">Tick : ${d.tickMs || '—'} ms</span>
      ${d.nextScheduled ? `<span class="sched-stat">Prochaine : <strong>${escHtml(d.nextScheduled.name)}</strong> — ${new Date(d.nextScheduled.at).toLocaleTimeString()}</span>` : ''}
      <span class="sched-stat">Ticks : ${d.tickCount || 0}</span>
    </div>`;
}

/* ── loadSchedules ───────────────────────── */
async function loadSchedules() {
  try {
    const res = await fetch('/api/scheduler/schedules');
    const data = await res.json();
    renderSchedules(data.schedules || []);
  } catch {
    const el = document.getElementById('schedList');
    if (el) el.innerHTML = '<p class="sched-error">Backend non disponible.</p>';
  }
}

function renderSchedules(schedules) {
  const el = document.getElementById('schedList');
  if (!el) return;

  if (!schedules.length) {
    el.innerHTML = '<p class="sched-empty">Aucune tâche configurée.</p>';
    return;
  }

  el.innerHTML = schedules.map(s => `
    <div class="sched-card ${s.enabled ? 'sched-enabled' : 'sched-disabled'}">
      <div class="sched-card-header">
        <span class="sched-badge ${s.enabled ? 'badge-sched-active' : 'badge-sched-off'}">${s.enabled ? 'Actif' : 'Désactivé'}</span>
        <span class="sched-name">${escHtml(s.name)}</span>
        <span class="sched-action-type">${escHtml(s.actionType)}</span>
        <span class="sched-schedule-type">${escHtml(_schedLabel(s.schedule))}</span>
      </div>
      ${s.description ? `<div class="sched-desc">${escHtml(s.description)}</div>` : ''}
      <div class="sched-meta">
        ${s.lastRunAt ? `Dernière : ${new Date(s.lastRunAt).toLocaleString()}` : 'Jamais exécutée'}
        ${s.nextRunAt ? ` · Prochaine : ${new Date(s.nextRunAt).toLocaleString()}` : ''}
      </div>
      <div class="sched-card-actions">
        <button class="btn-sched-run"     onclick="runScheduleNow('${s.id}', '${escHtml(s.name)}')">▶ Exécuter</button>
        ${s.enabled
          ? `<button class="btn-sched-disable" onclick="disableSchedule('${s.id}')">⏸ Désactiver</button>`
          : `<button class="btn-sched-enable"  onclick="enableSchedule('${s.id}')">▶ Activer</button>`}
        <button class="btn-sched-delete"  onclick="deleteSchedule('${s.id}', '${escHtml(s.name)}')">✕ Supprimer</button>
      </div>
    </div>
  `).join('');
}

function _schedLabel(sched) {
  if (!sched) return 'Manuel';
  if (sched.type === 'interval') return `Toutes les ${sched.intervalMinutes || '?'} min`;
  if (sched.type === 'daily')    return `Quotidien à ${sched.time || '?'}`;
  if (sched.type === 'weekly')   return `Hebdo ${(sched.daysOfWeek || []).join(', ')} à ${sched.time || '?'}`;
  return 'Manuel';
}

/* ── loadSchedulerHistory ────────────────── */
async function loadSchedulerHistory() {
  try {
    const res     = await fetch('/api/scheduler/history?limit=30');
    const data    = await res.json();
    SCHED_HISTORY = data.history || [];
  } catch {
    SCHED_HISTORY = [];
  }
  renderSchedulerHistory();
  document.getElementById('schedHistoryPanel').style.display = '';
}

function renderSchedulerHistory() {
  const el = document.getElementById('schedHistoryContent');
  if (!el) return;
  const history = SCHED_HISTORY || [];

  if (!history.length) {
    el.innerHTML = '<p class="sched-empty">Aucun historique.</p>';
    return;
  }

  el.innerHTML = history.map(r => `
    <div class="sched-history-item sched-hist-${r.status}">
      <span class="sched-hist-icon">${r.status === 'success' ? '✓' : (r.status === 'failed' ? '✕' : '⟳')}</span>
      <span class="sched-hist-name">${escHtml(r.scheduleName || '—')}</span>
      <span class="sched-hist-action">${escHtml(r.actionType || '')}</span>
      <span class="sched-hist-msg">${escHtml(r.message || '')}</span>
      <span class="sched-hist-time">${r.finishedAt ? new Date(r.finishedAt).toLocaleString() : '—'}</span>
      ${r.durationMs != null ? `<span class="sched-hist-dur">${r.durationMs} ms</span>` : ''}
    </div>
  `).join('');
}

/* ── loadSchedulerActions ────────────────── */
async function loadSchedulerActions() {
  try {
    const res     = await fetch('/api/scheduler/actions');
    SCHED_ACTIONS = await res.json();
  } catch {
    SCHED_ACTIONS = { allowed: [], blocked: [] };
  }
  renderSchedulerActions();
  document.getElementById('schedActionsPanel').style.display = '';
}

function renderSchedulerActions() {
  const el = document.getElementById('schedActionsContent');
  if (!el || !SCHED_ACTIONS) return;

  const allowedItems = (SCHED_ACTIONS.allowed || []).map(a =>
    `<div class="sched-action-item sched-action-ok">✓ <strong>${escHtml(a.actionType)}</strong> — ${escHtml(a.description || '')}</div>`
  ).join('');

  const blockedItems = (SCHED_ACTIONS.blocked || []).map(a =>
    `<div class="sched-action-item sched-action-blocked">✕ <strong>${escHtml(a.actionType)}</strong> — <em>${escHtml(a.reason || '')}</em></div>`
  ).join('');

  el.innerHTML = `
    <div class="sched-actions-list">
      <h5 class="sched-actions-label sched-ok-label">Actions autorisées</h5>
      ${allowedItems}
      <h5 class="sched-actions-label sched-blocked-label">Actions bloquées</h5>
      ${blockedItems}
    </div>`;
}

/* ── createSchedule ──────────────────────── */
async function createSchedule() {
  const name    = document.getElementById('schedNewName')?.value?.trim();
  const action  = document.getElementById('schedNewAction')?.value;
  const type    = document.getElementById('schedNewType')?.value || 'manual';
  const interval= parseInt(document.getElementById('schedNewInterval')?.value || '30', 10);
  const msgEl   = document.getElementById('schedCreateMsg');

  if (!name)   { if (msgEl) { msgEl.style.display = ''; msgEl.innerHTML = '<span class="sched-error">Nom requis.</span>'; } return; }
  if (!action) { if (msgEl) { msgEl.style.display = ''; msgEl.innerHTML = '<span class="sched-error">Action requise.</span>'; } return; }

  const schedule = type === 'interval'
    ? { type: 'interval', intervalMinutes: interval }
    : type === 'daily'
      ? { type: 'daily', time: '08:00' }
      : { type: 'manual' };

  try {
    const res  = await fetch('/api/scheduler/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, actionType: action, schedule }),
    });
    const data = await res.json();
    if (data.success) {
      if (msgEl) { msgEl.style.display = ''; msgEl.innerHTML = `<span class="sched-ok">✓ Tâche "${escHtml(name)}" créée.</span>`; }
      document.getElementById('schedNewName').value = '';
      await loadSchedules();
      await loadSchedulerStatus();
    } else {
      if (msgEl) { msgEl.style.display = ''; msgEl.innerHTML = `<span class="sched-error">✕ ${escHtml(data.error || 'Erreur')}</span>`; }
    }
  } catch {
    if (msgEl) { msgEl.style.display = ''; msgEl.innerHTML = '<span class="sched-error">✕ Erreur serveur.</span>'; }
  }
}

/* ── updateSchedule ──────────────────────── */
async function updateSchedule(id, patch) {
  try {
    const res = await fetch(`/api/scheduler/schedules/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    return await res.json();
  } catch { return { success: false }; }
}

/* ── enableSchedule ──────────────────────── */
async function enableSchedule(id) {
  await fetch(`/api/scheduler/schedules/${encodeURIComponent(id)}/enable`, { method: 'PATCH' });
  await loadSchedules();
  await loadSchedulerStatus();
}

/* ── disableSchedule ─────────────────────── */
async function disableSchedule(id) {
  await fetch(`/api/scheduler/schedules/${encodeURIComponent(id)}/disable`, { method: 'PATCH' });
  await loadSchedules();
  await loadSchedulerStatus();
}

/* ── runScheduleNow ──────────────────────── */
async function runScheduleNow(id, name) {
  const el = document.querySelector(`.sched-card [onclick*="${id}"] .btn-sched-run`);
  try {
    const res  = await fetch(`/api/scheduler/schedules/${encodeURIComponent(id)}/run`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert(`✓ "${name}" exécutée — ${data.message || 'Succès'} (${data.durationMs || 0} ms)`);
    } else {
      alert(`✕ Refusée : ${data.reason || data.error || 'Erreur'}`);
    }
    await loadSchedules();
    await loadSchedulerStatus();
    if (document.getElementById('schedHistoryPanel')?.style.display !== 'none') {
      await loadSchedulerHistory();
    }
  } catch {
    alert('Erreur serveur lors de l\'exécution.');
  }
}

/* ── deleteSchedule ──────────────────────── */
async function deleteSchedule(id, name) {
  if (!confirm(`Supprimer la tâche "${name}" ?`)) return;
  await fetch(`/api/scheduler/schedules/${encodeURIComponent(id)}`, { method: 'DELETE' });
  await loadSchedules();
  await loadSchedulerStatus();
}

/* ── clearSchedulerHistory ───────────────── */
async function clearSchedulerHistory() {
  if (!confirm('Vider l\'historique des tâches planifiées ?')) return;
  await fetch('/api/scheduler/history', { method: 'DELETE' });
  SCHED_HISTORY = [];
  renderSchedulerHistory();
}

/* -----------------------------------------------
   UTILS
----------------------------------------------- */
function navScrollTo(selector) {
  document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' });
}

/* -----------------------------------------------
   INIT
----------------------------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  /* Placeholders pendant le chargement */
  ['devicesGrid', 'agentsGrid', 'mediaGrid', 'scenariosGrid'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<p class="loading-placeholder">Chargement…</p>';
  });

  try {
    await loadData();
  } catch (err) {
    /* Échec total (protocole file://) → écran d'erreur explicite */
    document.body.innerHTML = `
      <div style="font-family:monospace;padding:40px;max-width:700px;margin:0 auto;color:#e2e8f0;background:#0D1B2A;min-height:100vh">
        <h2 style="color:#FF6B6B;margin-bottom:16px">⚠ Erreur de chargement des données</h2>
        <p style="color:#94a3b8;margin-bottom:24px">
          Le navigateur bloque <code>fetch()</code> sur <code>file://</code>.
          Utilisez un serveur local.
        </p>
        <h3 style="color:#f1f5f9;margin-bottom:10px">Option 1 — Node.js (Phase 3, recommandé)</h3>
        <pre style="background:#060f1a;padding:16px;border-radius:8px;color:#6ee7b7;overflow-x:auto">cd C:\\Users\\Youss\\Sallon_ConnecT
npm install
npm start</pre>
        <p style="color:#94a3b8;margin:10px 0 24px">Puis ouvrir : <a href="http://localhost:3000" style="color:#2563EB">http://localhost:3000</a></p>
        <h3 style="color:#f1f5f9;margin-bottom:10px">Option 2 — Python (Phase 2, sans backend)</h3>
        <pre style="background:#060f1a;padding:16px;border-radius:8px;color:#6ee7b7;overflow-x:auto">python -m http.server 8080</pre>
        <h3 style="color:#f1f5f9;margin:24px 0 10px">Option 3 — VS Code</h3>
        <p style="color:#94a3b8">Extension <strong>Live Server</strong> → clic droit sur index.html → <em>Open with Live Server</em>.</p>
      </div>
    `;
    return;
  }

  /* Rendu initial — sections Phase 1-3 */
  updateHeroStats();
  renderDevices();
  renderAgents();
  renderMedia();
  renderScenarios();

  /* Phase 4 — centre multimédia */
  await loadMediaCenter();
  renderConnectorStatus();
  renderMediaServiceCards();
  renderPlaylists();

  /* Phase 5 — orchestrateur scénarios */
  await loadScenarioRuntime();
  loadScenarioHistory();

  /* Phase 6 — diagnostic ADB */
  await Promise.all([loadAdbStatus(), loadAdbDiagnostics()]);
  renderAdbPanel();

  /* Phase 7 — statut DLNA (cache initial) */
  await loadDlnaStatus();
  renderDlnaPanel();

  /* Phase 8 — statut SmartThings */
  await loadSmartThingsStatus();
  renderSmartThingsPanel();

  /* Phase 12 — notifications locales */
  await loadNotifications();
  initBrowserNotifButton();
  if (DATA_SOURCE === 'live') pollNotifications();

  /* Éléments UI Phase 3 */
  updateSourceBadge();
  updateScanButton();

  /* Démarrage du rafraîchissement automatique si backend actif */
  if (DATA_SOURCE === 'live') startLiveRefresh();

  /* Fermeture modale */
  document.getElementById('deviceModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
});
