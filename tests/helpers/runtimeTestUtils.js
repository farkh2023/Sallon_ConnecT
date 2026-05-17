'use strict';

const fs = require('fs');
const path = require('path');

const TEST_RUNTIME_BASE = path.resolve('tests/.runtime');

/**
 * Creates (or resets) a named sub-directory inside tests/.runtime/.
 * @param {string} name e.g. 'profiles', 'backup', 'notifications'
 * @returns {string} absolute path to the created directory
 */
function createTestRuntimeDir(name) {
  const dir = path.join(TEST_RUNTIME_BASE, name);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Empties all files inside a named test-runtime sub-directory, keeping the dir.
 */
function resetTestRuntimeDir(name) {
  const dir = path.join(TEST_RUNTIME_BASE, name);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    return dir;
  }
  for (const file of fs.readdirSync(dir)) {
    try { fs.unlinkSync(path.join(dir, file)); } catch { /* ignore */ }
  }
  return dir;
}

/**
 * Removes the named sub-directory and all its contents.
 */
function cleanupTestRuntimeDir(name) {
  const dir = path.join(TEST_RUNTIME_BASE, name);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Sets process.env variables to redirect runtime files to tests/.runtime/<name>/.
 * @param {string} name sub-directory name
 * @param {Record<string, string>} envMap mapping of env var name → filename inside the dir
 * @returns {Record<string, string|undefined>} original values (for restoration in afterAll)
 */
function setRuntimeEnvForSuite(name, envMap) {
  const dir = createTestRuntimeDir(name);
  const originals = {};
  for (const [envKey, fileName] of Object.entries(envMap)) {
    originals[envKey] = process.env[envKey];
    process.env[envKey] = path.join(dir, fileName);
  }
  return originals;
}

/**
 * Restores env vars from the saved originals returned by setRuntimeEnvForSuite.
 */
function restoreRuntimeEnv(originals) {
  for (const [key, val] of Object.entries(originals)) {
    if (val === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = val;
    }
  }
}

module.exports = {
  createTestRuntimeDir,
  resetTestRuntimeDir,
  cleanupTestRuntimeDir,
  setRuntimeEnvForSuite,
  restoreRuntimeEnv,
  TEST_RUNTIME_BASE,
};
