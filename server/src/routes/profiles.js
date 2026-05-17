'use strict';

const express = require('express');
const router = express.Router();
const profileStore = require('../services/profiles/profileStore');
const profileEngine = require('../services/profiles/profileEngine');
const { explainPermissionDecision } = require('../services/profiles/profilePermissions');
const {
  sanitizeProfileForResponse,
  validateProfileInput,
  validateProfilePreferences,
  buildSafeProfileError,
} = require('../services/profiles/profileSafety');

const PIN_ENABLED = process.env.PROFILES_ALLOW_PIN === 'true';
const MAX_ITEMS = parseInt(process.env.PROFILES_MAX_ITEMS || '10', 10);

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

/* ── Ensure defaults on every request ── */
router.use((_req, _res, next) => {
  try { profileEngine.ensureDefaultProfiles(); } catch { /* silent */ }
  next();
});

/* GET /api/profiles/safety */
router.get('/safety', (_req, res) => {
  res.json({
    localOnly: true,
    cloudSync: false,
    secretsStored: false,
    pinEnabled: PIN_ENABLED,
    maxProfiles: MAX_ITEMS,
    runtimeProtected: true,
    auditEnabled: process.env.PROFILES_AUDIT_ENABLED !== 'false',
  });
});

/* GET /api/profiles/stats */
router.get('/stats', (_req, res) => {
  try {
    res.json(profileStore.getProfileStats());
  } catch (err) {
    res.status(500).json(buildSafeProfileError(err));
  }
});

/* GET /api/profiles/audit */
router.get('/audit', (_req, res) => {
  try {
    const entries = profileEngine.getAudit();
    res.json({ entries, total: entries.length });
  } catch (err) {
    res.status(500).json(buildSafeProfileError(err));
  }
});

/* DELETE /api/profiles/audit */
router.delete('/audit', (_req, res) => {
  try {
    const result = profileEngine.clearAudit();
    res.json({ status: 'ok', ...result });
  } catch (err) {
    res.status(500).json(buildSafeProfileError(err));
  }
});

/* GET /api/profiles/active */
router.get('/active', (_req, res) => {
  try {
    const profile = profileStore.getActiveProfile();
    if (!profile) return res.status(404).json({ status: 'not_found', message: 'Aucun profil actif.' });
    res.json(sanitizeProfileForResponse(profile));
  } catch (err) {
    res.status(500).json(buildSafeProfileError(err));
  }
});

/* GET /api/profiles */
router.get('/', (_req, res) => {
  try {
    const profiles = profileStore.loadProfiles();
    res.json({
      profiles: profiles.map(sanitizeProfileForResponse),
      total: profiles.length,
    });
  } catch (err) {
    res.status(500).json(buildSafeProfileError(err));
  }
});

/* POST /api/profiles */
router.post('/', (req, res) => {
  try {
    const input = req.body || {};
    const { valid, errors } = validateProfileInput(input);
    if (!valid) return res.status(400).json({ status: 'error', errors });

    const prefValidation = validateProfilePreferences(input.preferences);
    if (!prefValidation.valid) return res.status(400).json({ status: 'error', errors: prefValidation.errors });

    const profile = profileStore.createProfile(input);
    profileEngine.auditProfileEvent({ event: 'profile_create', profileId: profile.id, profileName: profile.name, profileType: profile.type });
    res.status(201).json(sanitizeProfileForResponse(profile));
  } catch (err) {
    const msg = err && err.message;
    if (msg && msg.includes('maximum')) return res.status(409).json({ status: 'error', error: msg });
    res.status(500).json(buildSafeProfileError(err));
  }
});

/* GET /api/profiles/:id */
router.get('/:id', (req, res) => {
  try {
    const profile = profileStore.getProfile(req.params.id);
    if (!profile) return res.status(404).json({ status: 'not_found' });
    res.json(sanitizeProfileForResponse(profile));
  } catch (err) {
    res.status(500).json(buildSafeProfileError(err));
  }
});

/* PATCH /api/profiles/:id */
router.patch('/:id', (req, res) => {
  try {
    const patch = req.body || {};
    if (patch.preferences) {
      const { valid, errors } = validateProfilePreferences(patch.preferences);
      if (!valid) return res.status(400).json({ status: 'error', errors });
    }
    const updated = profileStore.updateProfile(req.params.id, patch);
    profileEngine.auditProfileEvent({ event: 'profile_update', profileId: updated.id, profileName: updated.name, profileType: updated.type });
    res.json(sanitizeProfileForResponse(updated));
  } catch (err) {
    const msg = err && err.message;
    if (msg && msg.includes('introuvable')) return res.status(404).json({ status: 'not_found', error: msg });
    res.status(500).json(buildSafeProfileError(err));
  }
});

/* DELETE /api/profiles/:id */
router.delete('/:id', (req, res) => {
  try {
    const result = profileStore.deleteProfile(req.params.id);
    profileEngine.auditProfileEvent({ event: 'profile_delete', profileId: req.params.id });
    res.json({ status: 'ok', ...result });
  } catch (err) {
    const msg = err && err.message;
    if (msg && msg.includes('principal')) return res.status(403).json({ status: 'error', error: msg });
    if (msg && msg.includes('introuvable')) return res.status(404).json({ status: 'not_found', error: msg });
    res.status(500).json(buildSafeProfileError(err));
  }
});

/* POST /api/profiles/:id/activate */
router.post('/:id/activate', (req, res) => {
  try {
    const profile = profileEngine.switchProfile(req.params.id);
    res.json({ status: 'ok', active: sanitizeProfileForResponse(profile) });
  } catch (err) {
    const msg = err && err.message;
    if (msg && msg.includes('introuvable')) return res.status(404).json({ status: 'not_found', error: msg });
    res.status(500).json(buildSafeProfileError(err));
  }
});

/* GET /api/profiles/:id/permissions */
router.get('/:id/permissions', (req, res) => {
  try {
    const profile = profileStore.getProfile(req.params.id);
    if (!profile) return res.status(404).json({ status: 'not_found' });
    res.json({
      profileId: String(profile.id).slice(0, 16),
      profileType: profile.type,
      permissions: profile.permissions || {},
      safety: profile.safety || {},
      readOnlyMode: !!(profile.safety || {}).readOnlyMode,
    });
  } catch (err) {
    res.status(500).json(buildSafeProfileError(err));
  }
});

/* POST /api/profiles/:id/check-action */
router.post('/:id/check-action', (req, res) => {
  try {
    const profile = profileStore.getProfile(req.params.id);
    if (!profile) return res.status(404).json({ status: 'not_found' });
    const actionType = req.body && req.body.actionType ? String(req.body.actionType).slice(0, 60) : '';
    if (!actionType) return res.status(400).json({ status: 'error', error: 'actionType requis.' });
    const decision = explainPermissionDecision(profile, actionType);
    res.json(decision);
  } catch (err) {
    res.status(500).json(buildSafeProfileError(err));
  }
});

module.exports = router;
