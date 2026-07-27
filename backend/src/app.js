'use strict';

const express = require('express');
const cors = require('cors');
const config = require('./config');
const { createHealthHandler } = require('./shared/health-handler');
const { createMonitorRouter } = require('./modules/monitor/monitor-routes');
const { notFoundHandler, errorHandler } = require('./shared/error-handler');
const { setupSwagger } = require('./swagger');

// Builds the Express app without binding a port, so tests can drive it via
// supertest and the server entrypoint can attach WebSockets to it.
function createApp({ monitorService = null, scheduler = null, broadcaster = null, analysisService } = {}) {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', createHealthHandler({ scheduler, broadcaster }));

  app.use('/api', createMonitorRouter({ monitorService, analysisService }));

  setupSwagger(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
