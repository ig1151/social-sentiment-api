"use strict";
const { lookupApiKey } = require("../services/apiKeyService");
const { fail } = require("../utils/response");

async function apiKeyMiddleware(req, res, next) {
  const provided = (req.headers["x-api-key"] || "").trim();
  if (!provided) return fail(res, 401, "Missing x-api-key header");
  let record;
  try {
    record = await lookupApiKey(provided);
  } catch (err) {
    return next(err);
  }
  if (!record) return fail(res, 401, "Invalid API key");
  if (!record.active) return fail(res, 403, "API key has been revoked");
  req.apiKey = record;
  next();
}

module.exports = { apiKeyMiddleware };