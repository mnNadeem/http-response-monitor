'use strict';

// Pure stats helpers — no deps, no side effects, so correctness is easy to test.

function mean(values) {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

// Sample standard deviation (n-1). Returns null for fewer than 2 points.
function stddev(values) {
  if (values.length < 2) return null;
  const m = mean(values);
  const variance = values.reduce((a, v) => a + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function zScore(value, m, sd) {
  if (m === null || sd === null || sd === 0) return null;
  return (value - m) / sd;
}

// EWMA (single exponential smoothing): level = α·x + (1-α)·prevLevel.
// The new level is the one-step-ahead forecast. Seeds with the first value.
function ewmaStep(prevLevel, value, alpha) {
  if (prevLevel === null || prevLevel === undefined) return value;
  return alpha * value + (1 - alpha) * prevLevel;
}

const REASONS = {
  FAILURE: 'request_failed',
  SPIKE: 'latency_spike',
  DROP: 'latency_drop',
  PREDICTION: 'prediction_error',
};

module.exports = { mean, stddev, zScore, ewmaStep, REASONS };
