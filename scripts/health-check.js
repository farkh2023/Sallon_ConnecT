'use strict';

const BASE_URL = process.env.SALLON_CONNECT_HEALTH_URL || 'http://localhost:3000';
const ENDPOINTS = [
  '/api/health',
  '/api/observability/overview',
  '/api/observability/safety',
];

async function checkEndpoint(path) {
  const response = await fetch(`${BASE_URL}${path}`, { cache: 'no-store' });
  if (!response.ok) {
    return { path, ok: false, status: response.status };
  }

  const json = await response.json();
  return {
    path,
    ok: true,
    status: response.status,
    appStatus: json.status || 'ok',
    phase: json.phase || null,
  };
}

async function main() {
  const results = [];
  for (const endpoint of ENDPOINTS) {
    results.push(await checkEndpoint(endpoint));
  }

  for (const result of results) {
    const phase = result.phase ? ` phase=${result.phase}` : '';
    console.log(`${result.ok ? 'OK' : 'FAIL'} ${result.path} http=${result.status} status=${result.appStatus || 'n/a'}${phase}`);
  }

  if (results.some((result) => !result.ok)) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(`FAIL health-check ${err instanceof Error ? err.message : 'unknown error'}`);
  process.exitCode = 1;
});
