'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../../..');
const EXPECTED_SCRIPTS = [
  'test',
  'test:backend',
  'test:frontend',
  'test:packaging',
  'test:windows',
  'build:frontend',
  'check',
];
const EXPECTED_FILES = [
  'jest.config.js',
  'frontend/vitest.config.ts',
  '.github/workflows/tests.yml',
  'docs/PHASE17.md',
  'docs/PHASE17B.md',
];

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function loadPackageScripts() {
  try {
    const raw = fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw);
    return pkg.scripts || {};
  } catch {
    return {};
  }
}

function collectTests() {
  const scripts = loadPackageScripts();
  const scriptChecks = Object.fromEntries(
    EXPECTED_SCRIPTS.map((script) => [script, Boolean(scripts[script])])
  );
  const fileChecks = Object.fromEntries(
    EXPECTED_FILES.map((file) => [file, fileExists(file)])
  );
  const missingScripts = Object.entries(scriptChecks)
    .filter(([, present]) => !present)
    .map(([script]) => script);
  const missingFiles = Object.entries(fileChecks)
    .filter(([, present]) => !present)
    .map(([file]) => file);

  return {
    status: missingScripts.length || missingFiles.length ? 'warning' : 'ok',
    scripts: scriptChecks,
    files: fileChecks,
    missingScripts,
    missingFiles,
    apiRunsTests: false,
    lastUpdatedAt: new Date().toISOString(),
  };
}

module.exports = {
  collectTests,
};
