'use strict';

const repository = require('./monitor-repository');
const { analysisService: defaultAnalysisService } = require('./analysis-service');
const { ApiError } = require('../../shared/error-handler');

// Parses ?success=true|false into a boolean or undefined (no filter).
function parseSuccessFilter(value) {
  if (value === undefined) return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new ApiError(400, "Query param 'success' must be 'true' or 'false'");
}

function createMonitorController({ monitorService, analysisService = defaultAnalysisService } = {}) {
  return {
    async getAnalysis(req, res) {
      res.json(await analysisService.analyze());
    },

    async listResults(req, res) {
      const { limit, offset, success, sortBy, order } = req.query;
      const result = await repository.listResults({
        limit,
        offset,
        success: parseSuccessFilter(success),
        sortBy,
        order,
      });
      res.json(result);
    },

    async getStats(req, res) {
      res.json(await repository.getStats());
    },

    async getResult(req, res) {
      const record = await repository.findById(req.params.id);
      if (!record) throw new ApiError(404, `No monitor result with id ${req.params.id}`);
      res.json(record);
    },

    async runMonitor(req, res) {
      if (!monitorService) throw new ApiError(503, 'Monitor service is not available');
      const record = await monitorService.runOnce();
      res.status(201).json(record);
    },
  };
}

module.exports = { createMonitorController, parseSuccessFilter };
