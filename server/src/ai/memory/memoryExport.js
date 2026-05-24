'use strict';

const path = require('path');
const fs   = require('fs');

const { getAllItems, createItem } = require('./memoryStore');
const { sanitizeForExport, sanitizeMemoryItem } = require('./memorySafety');
const { validateMemoryItem } = require('./memoryTypes');

function _exportsDir() {
  try {
    return path.join(require('../../workspaces/workspaceContext').getCurrentContext().memory, 'exports');
  } catch {
    return path.join(process.cwd(), 'runtime', 'ai-memory', 'exports');
  }
}

function _ensureExportsDir() {
  const dir = _exportsDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function exportAll(label = '') {
  const exportsDir = _ensureExportsDir();

  const items    = getAllItems();
  const exported = items.map(sanitizeForExport).filter(Boolean);
  const filename = `memory-export-${Date.now()}.json`;
  const payload  = {
    exportedAt: new Date().toISOString(),
    label:      String(label).slice(0, 100) || 'export',
    totalItems: exported.length,
    localOnly:  true,
    items:      exported,
  };

  fs.writeFileSync(path.join(exportsDir, filename), JSON.stringify(payload, null, 2), 'utf8');
  return { ok: true, filename, totalItems: exported.length };
}

function importItems(payload) {
  if (!payload || !Array.isArray(payload.items)) {
    return { ok: false, errors: ['format_invalide'], imported: 0 };
  }

  const errors  = [];
  let   imported = 0;

  for (const raw of payload.items) {
    const sanitized = sanitizeMemoryItem(raw);
    if (!sanitized || !sanitized.id) {
      errors.push(`item_invalide_sans_id`);
      continue;
    }

    sanitized.localOnly = true;
    const check = validateMemoryItem(sanitized);
    if (!check.valid) {
      errors.push(`${sanitized.id}: ${check.errors.join(', ')}`);
      continue;
    }

    const result = createItem(sanitized);
    if (result.ok) imported++;
    else errors.push(`${sanitized.id}: ${result.error}`);
  }

  return { ok: imported > 0 || (errors.length === 0 && payload.items.length === 0), imported, errors };
}

module.exports = { exportAll, importItems };
