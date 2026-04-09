"use strict";
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Check if the API is online
 *     tags: [System]
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy
 */
const express = require("express");
const { send } = require("../utils/response");
const router = express.Router();

router.get("/", (req, res) => {
  return send(res, 200, { status: "ok", uptime: process.uptime() });
});

module.exports = router;