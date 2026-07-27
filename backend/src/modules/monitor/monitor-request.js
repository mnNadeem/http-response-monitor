'use strict';

function elapsedMs(startedAt) {
  return Number((process.hrtime.bigint() - startedAt) / 1_000_000n);
}

// httpbin returns JSON, but fall back to wrapped raw text so the JSONB column
// always gets valid JSON.
async function safeParseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 10000) };
  }
}

module.exports = { elapsedMs, safeParseBody };
