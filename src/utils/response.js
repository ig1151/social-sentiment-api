"use strict";
function send(res, statusCode, data, meta = {}) {
  return res.status(statusCode).json({
    success: true,
    data,
    meta: { timestamp: new Date().toISOString(), ...meta }
  });
}
function fail(res, statusCode, message) {
  return res.status(statusCode).json({
    success: false,
    error: { message, code: statusCode },
    meta: { timestamp: new Date().toISOString() }
  });
}
module.exports = { send, fail };