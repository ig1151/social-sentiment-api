"use strict";
const { v4: uuidv4 } = require("uuid");
const prisma = require("../db/client");

function generateKey() {
  return "snt_" + uuidv4().replace(/-/g, "");
}

async function createApiKey(plan = "free") {
  const key = generateKey();
  return prisma.apiKey.create({ data: { key, plan } });
}

async function revokeApiKey(key) {
  const record = await prisma.apiKey.findUnique({ where: { key } });
  if (!record) {
    const err = new Error("API key not found");
    err.status = 404;
    throw err;
  }
  return prisma.apiKey.update({ where: { key }, data: { active: false } });
}

async function lookupApiKey(key) {
  return prisma.apiKey.findUnique({ where: { key } });
}

module.exports = { createApiKey, revokeApiKey, lookupApiKey };