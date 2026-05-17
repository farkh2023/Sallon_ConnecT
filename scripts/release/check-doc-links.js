'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const filesToCheck = ['README.md', 'docs/INDEX.md'];
const externalSchemes = /^(https?:|mailto:|tel:|#)/i;
const markdownLink = /!?\[[^\]]*]\(([^)]+)\)/g;

let failures = 0;

function normalizeTarget(rawTarget) {
  const trimmed = rawTarget.trim();
  if (!trimmed || externalSchemes.test(trimmed)) return null;

  const withoutTitle = trimmed.match(/^<([^>]+)>/)?.[1] || trimmed.split(/\s+/)[0];
  const withoutAnchor = withoutTitle.split('#')[0].split('?')[0];
  if (!withoutAnchor || externalSchemes.test(withoutAnchor)) return null;

  return decodeURIComponent(withoutAnchor.replace(/\\/g, '/'));
}

function checkFile(sourceFile) {
  const sourcePath = path.join(root, sourceFile);
  const sourceDir = path.dirname(sourcePath);
  const content = fs.readFileSync(sourcePath, 'utf8');

  for (const match of content.matchAll(markdownLink)) {
    const target = normalizeTarget(match[1]);
    if (!target) continue;

    const resolved = path.resolve(sourceDir, target);
    const relative = path.relative(root, resolved);

    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      console.error(`[ERROR] ${sourceFile} -> ${target} sort du depot`);
      failures += 1;
      continue;
    }

    if (!fs.existsSync(resolved)) {
      console.error(`[ERROR] ${sourceFile} -> ${target} introuvable`);
      failures += 1;
    } else {
      console.log(`[OK] ${sourceFile} -> ${target}`);
    }
  }
}

for (const file of filesToCheck) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`[ERROR] Fichier absent : ${file}`);
    failures += 1;
    continue;
  }
  checkFile(file);
}

if (failures > 0) {
  console.error(`Documentation invalide : ${failures} lien(s) local(aux) casse(s).`);
  process.exit(1);
}

console.log('Documentation OK : liens locaux valides.');
