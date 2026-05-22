'use strict';

const { spawn } = require('child_process');
const path = require('path');
const fs   = require('fs');

const ROOT_DIR      = path.resolve(__dirname, '..', '..', '..', '..');
const BACKUP_SCRIPTS = path.join(ROOT_DIR, 'scripts', 'windows', 'backup');
const TIMEOUT_MS    = 30_000;

function runPowerShellScript(scriptPath, args) {
  const argList = args || [];
  return new Promise((resolve, reject) => {
    if (process.platform !== 'win32') {
      return resolve({ stdout: '', stderr: '', exitCode: 0 });
    }
    if (!fs.existsSync(scriptPath)) {
      return resolve({ stdout: '', stderr: 'script not found', exitCode: 1 });
    }
    const psArgs = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath].concat(argList);
    const child  = spawn('powershell.exe', psArgs, { windowsHide: true });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('timeout')); }, TIMEOUT_MS);

    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('close', code => {
      clearTimeout(timer);
      resolve({
        stdout: stdout.slice(0, 50_000),
        stderr: stderr.slice(0, 5_000),
        exitCode: code === null ? 1 : code,
      });
    });
    child.on('error', err => { clearTimeout(timer); reject(err); });
  });
}

function parseScriptOutput(output) {
  try {
    const data = JSON.parse(output.trim());
    return { data, ok: true };
  } catch {
    return { data: null, ok: false };
  }
}

async function runListBackups() {
  const script = path.join(BACKUP_SCRIPTS, 'list-backups.ps1');
  try {
    const { stdout } = await runPowerShellScript(script, ['-Json', '-RootPath', ROOT_DIR]);
    const { data } = parseScriptOutput(stdout);
    return data && data.snapshots ? data : { snapshots: [], total: 0 };
  } catch {
    return { snapshots: [], total: 0 };
  }
}

async function runCreateBackup(type, exportZip) {
  const script = path.join(BACKUP_SCRIPTS, 'create-backup.ps1');
  const args   = ['-Type', type || 'quick', '-RootPath', ROOT_DIR];
  if (exportZip) args.push('-ExportZip');
  try {
    return await runPowerShellScript(script, args);
  } catch {
    return { stdout: '', stderr: 'error', exitCode: 1 };
  }
}

async function runVerifyBackup(id) {
  const script = path.join(BACKUP_SCRIPTS, 'verify-backup.ps1');
  try {
    const { stdout, exitCode } = await runPowerShellScript(script, ['-SnapshotId', id, '-Json', '-RootPath', ROOT_DIR]);
    const { data } = parseScriptOutput(stdout);
    return { ok: exitCode === 0, results: data && data.results ? data.results : [] };
  } catch {
    return { ok: false, results: [] };
  }
}

async function runExportBackup(id) {
  const script = path.join(BACKUP_SCRIPTS, 'export-backup.ps1');
  try {
    const { exitCode } = await runPowerShellScript(script, ['-SnapshotId', id, '-RootPath', ROOT_DIR]);
    return { ok: exitCode === 0 };
  } catch {
    return { ok: false };
  }
}

async function runDeleteBackup(id, confirmation) {
  if (confirmation !== 'SUPPRIMER') return { ok: false, reason: 'confirmation_required' };
  const script = path.join(BACKUP_SCRIPTS, 'delete-backup.ps1');
  try {
    const { exitCode } = await runPowerShellScript(script, ['-SnapshotId', id, '-Force', '-RootPath', ROOT_DIR]);
    return { ok: exitCode === 0 };
  } catch {
    return { ok: false };
  }
}

module.exports = {
  runPowerShellScript,
  parseScriptOutput,
  runListBackups,
  runCreateBackup,
  runVerifyBackup,
  runExportBackup,
  runDeleteBackup,
};
