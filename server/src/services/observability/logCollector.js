'use strict';

const fs = require('fs');
const path = require('path');
const { roundSize, safeName } = require('./sanitizer');

const ROOT = path.resolve(__dirname, '../../../..');
const LOG_DIR = path.join(ROOT, 'logs');

function collectLogs() {
  let items = [];
  try {
    items = fs.readdirSync(LOG_DIR, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const fullPath = path.join(LOG_DIR, entry.name);
        const stat = fs.statSync(fullPath);
        return {
          name: safeName(entry.name),
          size: roundSize(stat.size),
          modifiedAt: stat.mtime.toISOString(),
        };
      })
      .sort((a, b) => String(b.modifiedAt).localeCompare(String(a.modifiedAt)));
  } catch {
    items = [];
  }

  return {
    status: 'ok',
    directory: 'logs',
    count: items.length,
    files: items,
    contentHidden: true,
    lastUpdatedAt: new Date().toISOString(),
  };
}

module.exports = {
  collectLogs,
};
