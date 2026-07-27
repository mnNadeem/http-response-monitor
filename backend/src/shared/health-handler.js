'use strict';

const config = require('../config');
const db = require('../db/pool');

// Readiness probe: pings the DB and reports scheduler + WS state. Returns 503
// when the DB is down so a process that's up but can't serve doesn't look healthy.
function createHealthHandler({ scheduler = null, broadcaster = null } = {}) {
  return async (req, res) => {
    const startedAt = process.hrtime.bigint();
    let dbConnected = false;
    let dbError;
    try {
      await db.query('SELECT 1');
      dbConnected = true;
    } catch (err) {
      dbError = err.message;
    }
    const dbLatencyMs = Number((process.hrtime.bigint() - startedAt) / 1_000_000n);

    res.status(dbConnected ? 200 : 503).json({
      status: dbConnected ? 'ok' : 'degraded',
      env: config.env,
      uptimeSec: Math.round(process.uptime()),
      time: new Date().toISOString(),
      checks: {
        database: {
          connected: dbConnected,
          latencyMs: dbLatencyMs,
          ...(dbError ? { error: dbError } : {}),
        },
        monitor: scheduler
          ? { scheduled: scheduler.isScheduled, schedule: scheduler.schedule, runInProgress: scheduler.isRunning }
          : { scheduled: false },
        websocket: { clients: broadcaster ? broadcaster.clientCount : 0 },
      },
    });
  };
}

module.exports = { createHealthHandler };
