'use strict';

const config = require('../config');
const { roundSize } = require('./sanitizer');

function collectHealth() {
  const memory = process.memoryUsage();
  const port = config.port || parseInt(process.env.PORT || '3000', 10);

  return {
    status: 'ok',
    phase: 18,
    backend: {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      nodeVersion: process.version,
      memoryUsed: roundSize(memory.heapUsed),
      memoryTotal: roundSize(memory.heapTotal),
      port,
      apiHealthAvailable: true,
      localOnly: true,
    },
    frontend: {
      status: 'expected',
      expectedHost: 'localhost',
      expectedPort: 3001,
      expectedUrl: 'http://localhost:3001',
    },
    environment: {
      mode: process.env.NODE_ENV === 'test' ? 'test' : 'local',
      localOnly: true,
      cloudTelemetry: false,
    },
    lastUpdatedAt: new Date().toISOString(),
  };
}

module.exports = {
  collectHealth,
};
