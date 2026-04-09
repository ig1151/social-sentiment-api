"use strict";
const store = new Map();

function getCache(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

function setCache(key, value, ttlSeconds) {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

function deleteCache(key) { store.delete(key); }
function clearCache() { store.clear(); }

module.exports = { getCache, setCache, deleteCache, clearCache };