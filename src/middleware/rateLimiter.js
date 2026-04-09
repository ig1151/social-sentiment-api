"use strict";
const rateLimit = require("express-rate-limit");

const rateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_RPM || "60"),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: { message: "Rate limit exceeded. Please slow down.", code: 429 },
      meta: { timestamp: new Date().toISOString() }
    });
  }
});

module.exports = { rateLimiter };