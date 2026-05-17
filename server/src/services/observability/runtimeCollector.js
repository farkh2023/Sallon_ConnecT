'use strict';

const fs = require('fs');
const path = require('path');
const { roundSize, safeName } = require('./sanitizer');

const ROOT = path.resolve(__dirname, '../../../..');

function statSafe(fullPath) {
  try {
    return fs.statSync(fullPath);
  } catch {
    return null;
  }
}

function walkDirectory(dirPath) {
  const entries = [];
  if (!fs.existsSync(dirPath)) return entries;

  const stack = [dirPath];
  while (stack.length) {
    const current = stack.pop();
    let list = [];
    try {
      list = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of list) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else if (entry.isFile()) {
        entries.push(fullPath);
      }
    }
  }

  return entries;
}

function directorySummary(name) {
  const dirPath = path.join(ROOT, name);
  const files = walkDirectory(dirPath);
  const totalBytes = files.reduce((sum, filePath) => {
    const stat = statSafe(filePath);
    return sum + (stat ? stat.size : 0);
  }, 0);

  return {
    name,
    exists: fs.existsSync(dirPath),
    fileCount: files.length,
    jsonFileCount: files.filter((filePath) => filePath.toLowerCase().endsWith('.json')).length,
    gitkeepPresent: fs.existsSync(path.join(dirPath, '.gitkeep')),
    totalSize: roundSize(totalBytes),
  };
}

function latestPortableZip() {
  const distPath = path.join(ROOT, 'dist');
  const files = walkDirectory(distPath)
    .filter((filePath) => filePath.toLowerCase().endsWith('.zip'))
    .map((filePath) => ({ filePath, stat: statSafe(filePath) }))
    .filter((item) => item.stat)
    .sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

  if (!files.length) {
    return { present: false, name: null, size: null, modifiedAt: null };
  }

  const latest = files[0];
  return {
    present: true,
    name: safeName(latest.filePath),
    size: roundSize(latest.stat.size),
    modifiedAt: latest.stat.mtime.toISOString(),
  };
}

function collectRuntime() {
  const runtime = directorySummary('runtime');
  const logs = directorySummary('logs');
  const dist = directorySummary('dist');

  return {
    status: 'ok',
    directories: {
      runtime,
      logs,
      dist,
    },
    runtimeJsonFiles: runtime.jsonFileCount,
    gitkeep: {
      runtime: runtime.gitkeepPresent,
      logs: logs.gitkeepPresent,
      dist: dist.gitkeepPresent,
    },
    latestPortableZip: latestPortableZip(),
    contentHidden: true,
    absolutePathsHidden: true,
    lastUpdatedAt: new Date().toISOString(),
  };
}

module.exports = {
  collectRuntime,
};
