const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.resolve(__dirname, '../..');
const dist = path.join(root, 'dist');

function ensureZip() {
  execFileSync(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(root, 'scripts/windows/package-portable.ps1')],
    { cwd: root, stdio: 'inherit' }
  );

  return fs.readdirSync(dist)
    .filter((name) => /^Sallon-ConnecT-Portable-.*\.zip$/.test(name))
    .map((name) => ({ name, mtime: fs.statSync(path.join(dist, name)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)[0].name;
}

function listZip(zipName) {
  const zipPath = path.join(dist, zipName).replace(/'/g, "''");
  const command = [
    `$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path '${zipPath}').Path);`,
    'try { $zip.Entries | ForEach-Object { $_.FullName } }',
    'finally { $zip.Dispose() }',
  ].join(' ');

  const output = execFileSync(
    'powershell',
    ['-NoProfile', '-Command', `Add-Type -AssemblyName System.IO.Compression.FileSystem; ${command}`],
    { cwd: root, encoding: 'utf8' }
  );
  return output.split(/\r?\n/).map((line) => line.trim().replace(/\\/g, '/')).filter(Boolean);
}

function expectPresent(entries, entry) {
  if (!entries.includes(entry)) {
    throw new Error(`Missing ZIP entry: ${entry}`);
  }
}

const forbidden = [
  /(^|\/)\.git(\/|$)/,
  /(^|\/)\.env$/,
  /\.env\.local$/,
  /(^|\/)node_modules(\/|$)/,
  /(^|\/)\.next(\/|$)/,
  /^runtime\/.*\.json$/,
  /^logs\/.*\.(log|txt)$/,
  /\.(pem|key)$/,
];

const required = [
  'README.md',
  '.env.example',
  'frontend/.env.example',
  'scripts/windows/start-sallon-connect.bat',
  'runtime/.gitkeep',
  'logs/.gitkeep',
];

const zipName = ensureZip();
const entries = listZip(zipName);

for (const entry of required) {
  expectPresent(entries, entry);
}

const blocked = entries.filter((entry) => forbidden.some((pattern) => pattern.test(entry)));
if (blocked.length > 0) {
  throw new Error(`Forbidden ZIP entries found:\n${blocked.join('\n')}`);
}

console.log(`ZIP ${zipName} OK (${entries.length} entries, exclusions verified).`);
