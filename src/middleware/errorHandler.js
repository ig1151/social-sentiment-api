"use strict";
const { fail } = require("../utils/response");

function notFound(req, res) {
  return fail(res, 404, `Route ${req.method} ${req.path} not found`);
}

function errorHandler(err, req, res, next) {
  console.error("[error]", err.message);
  const status = err.status || 500;
  return fail(res, status, err.message || "Internal server error");
}

module.exports = { notFound, errorHandler };