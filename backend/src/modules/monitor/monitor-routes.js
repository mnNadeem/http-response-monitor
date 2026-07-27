'use strict';

const express = require('express');
const { asyncHandler } = require('../../shared/async-handler');
const { createMonitorController } = require('./monitor-controller');

// `monitorService` is injected so POST /run can trigger a real cycle.
function createMonitorRouter({ monitorService, analysisService } = {}) {
  const router = express.Router();
  const controller = createMonitorController({ monitorService, analysisService });

  // Anomaly analysis over the rolling window: per-point rolling stats, forecast,
  // confidence band, and anomaly verdicts, plus a summary + recent alerts.
  router.get('/analysis', asyncHandler(controller.getAnalysis));

  // Historical data, most-recent-first, paginated.
  router.get('/results', asyncHandler(controller.listResults));

  // Aggregate stats — handy for the dashboard header.
  router.get('/stats', asyncHandler(controller.getStats));

  // Single record by id.
  router.get('/results/:id', asyncHandler(controller.getResult));

  // Manually trigger a monitor cycle (useful for demos and testing the pipeline
  // without waiting up to 5 minutes for the next cron tick).
  router.post('/monitor/run', asyncHandler(controller.runMonitor));

  return router;
}

module.exports = { createMonitorRouter };
