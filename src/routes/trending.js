"use strict";
/**
 * @swagger
 * /trending:
 *   get:
 *     summary: Get the top 10 trending stock tickers by social media mentions
 *     tags: [Trending]
 *     responses:
 *       200:
 *         description: Ranked list of trending tickers with mention counts
 *       401:
 *         description: Invalid or missing API key
 *       429:
 *         description: Rate limit exceeded
 */
const express = require("express");
const { fetchRedditPosts } = require("../services/redditService");
const { getCache, setCache } = require("../utils/cache");
const { send } = require("../utils/response");
const router = express.Router();

const TTL = 600;
const WATCH_TICKERS = [
  "AAPL", "TSLA", "NVDA", "AMD", "MSFT", "AMZN", "GOOGL",
  "META", "SPY", "QQQ", "GME", "AMC", "PLTR", "RIVN", "SOFI"
];

router.get("/", async (req, res, next) => {
  try {
    const cacheKey = "trending:all";
    const cached = getCache(cacheKey);
    if (cached) return send(res, 200, cached, { cached: true, ttl: TTL });

    const mentionMap = {};
    await Promise.all(
      WATCH_TICKERS.map(async ticker => {
        try {
          const posts = await fetchRedditPosts(ticker);
          mentionMap[ticker] = posts.length;
        } catch (e) {
          mentionMap[ticker] = 0;
        }
      })
    );

    const trending = Object.entries(mentionMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ticker, mentions], i) => ({
        rank: i + 1,
        ticker,
        mentions,
        trend: mentions > 10 ? "hot" : mentions > 5 ? "warm" : "cool",
      }));

    setCache(cacheKey, trending, TTL);
    return send(res, 200, trending, { cached: false, ttl: TTL });
  } catch (err) {
    next(err);
  }
});

module.exports = router;