"use strict";
const express = require("express");
const { createApiKey } = require("../services/apiKeyService");
const { send, fail } = require("../utils/response");
const router = express.Router();

router.post("/", async (req, res, next) => {
  try {
    const adminSecret = req.headers["x-admin-secret"];
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      return fail(res, 401, "Invalid or missing x-admin-secret header");
    }

    const { email, plan = "free" } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return fail(res, 400, "Valid email is required");
    }

    const record = await createApiKey(plan);
    return send(res, 201, {
      api_key:    record.key,
      email,
      plan:       record.plan,
      created_at: record.createdAt,
      message:    "Store this key — it won't be shown again.",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;