'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'HTTP Monitor API',
      version: '1.0.0',
      description:
        'Pings httpbin.org on a schedule, stores results in PostgreSQL, and streams live updates over WebSocket.',
    },
    servers: [{ url: '/api' }],
    components: {
      schemas: {
        MonitorResult: {
          type: 'object',
          properties: {
            id:              { type: 'integer', example: 42 },
            targetUrl:       { type: 'string',  example: 'https://httpbin.org/anything' },
            requestPayload:  { type: 'object' },
            success:         { type: 'boolean', example: true },
            statusCode:      { type: 'integer', nullable: true, example: 200 },
            responseTimeMs:  { type: 'integer', example: 312 },
            responseBody:    { type: 'object',  nullable: true },
            errorMessage:    { type: 'string',  nullable: true },
            requestedAt:     { type: 'string',  format: 'date-time' },
            createdAt:       { type: 'string',  format: 'date-time' },
          },
        },
        PaginatedResults: {
          type: 'object',
          properties: {
            items:      { type: 'array', items: { $ref: '#/components/schemas/MonitorResult' } },
            total:      { type: 'integer' },
            limit:      { type: 'integer' },
            offset:     { type: 'integer' },
          },
        },
        Stats: {
          type: 'object',
          properties: {
            totalRequests:   { type: 'integer' },
            successCount:    { type: 'integer' },
            failureCount:    { type: 'integer' },
            avgResponseTime: { type: 'number' },
          },
        },
        Analysis: {
          type: 'object',
          description: 'Rolling z-score / EWMA anomaly analysis over the configured window.',
        },
      },
    },
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          tags: ['Health'],
          responses: { 200: { description: 'Service status' } },
        },
      },
      '/results': {
        get: {
          summary: 'List monitor results (paginated)',
          tags: ['Monitor'],
          parameters: [
            { in: 'query', name: 'limit',   schema: { type: 'integer', default: 20 } },
            { in: 'query', name: 'offset',  schema: { type: 'integer', default: 0 } },
            { in: 'query', name: 'success', schema: { type: 'string', enum: ['true', 'false'] }, description: 'Filter by success/failure' },
            { in: 'query', name: 'sortBy',  schema: { type: 'string', default: 'requested_at' } },
            { in: 'query', name: 'order',   schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
          ],
          responses: {
            200: { description: 'Paginated list', content: { 'application/json': { schema: { $ref: '#/components/schemas/PaginatedResults' } } } },
          },
        },
      },
      '/results/{id}': {
        get: {
          summary: 'Get a single monitor result',
          tags: ['Monitor'],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
          responses: {
            200: { description: 'Monitor result', content: { 'application/json': { schema: { $ref: '#/components/schemas/MonitorResult' } } } },
            404: { description: 'Not found' },
          },
        },
      },
      '/stats': {
        get: {
          summary: 'Aggregate statistics',
          tags: ['Monitor'],
          responses: {
            200: { description: 'Stats', content: { 'application/json': { schema: { $ref: '#/components/schemas/Stats' } } } },
          },
        },
      },
      '/analysis': {
        get: {
          summary: 'Anomaly analysis over rolling window',
          tags: ['Analysis'],
          responses: {
            200: { description: 'Analysis data', content: { 'application/json': { schema: { $ref: '#/components/schemas/Analysis' } } } },
          },
        },
      },
      '/monitor/run': {
        post: {
          summary: 'Manually trigger a monitor cycle',
          tags: ['Monitor'],
          responses: {
            201: { description: 'Newly created result', content: { 'application/json': { schema: { $ref: '#/components/schemas/MonitorResult' } } } },
            503: { description: 'Monitor service unavailable' },
          },
        },
      },
    },
  },
  apis: [],
};

const spec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(spec, { explorer: true }));
  app.get('/api/docs.json', (_req, res) => res.json(spec));
}

module.exports = { setupSwagger };
