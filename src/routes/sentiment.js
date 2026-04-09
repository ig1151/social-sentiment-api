"use strict";
/**
 * @swagger
 * /sentiment:
 *   get:
 *     summary: Get AI-powered sentiment analysis for a stock ticker
 *     tags: [Sentiment]
 *     parameters:
 *       - in: query
 *         name: ticker
 *         required: true
 *         schema:
 *           type: string
 *         example: AAPL
 *         description: Stock ticker symbol (e.g. AAPL, TSLA, NVDA)
 *     responses:
 *       200:
 *         description: Sentiment analysis with score, trend, signal and top themes
 *       400:
 *         description: Missing or invalid ticker
 *       401:
 *         description: Invalid or missing API key
 *       429:
 *         description: Rate limit exceeded
 */
const express = require("express");
const { fetchRedditPosts } = require("../services/redditService");
const { fetchAllNews } = require("../services/newsService");
const { analyzeSentiment } = require("../services/sentimentService");
const { getCache, setCache } = require("../utils/cache");
const { send, fail } = require("../utils/response");
const router = express.Router();

const TTL = 300;

router.get("/", async (req, res, next) => {
  try {
    const ticker = (req.query.ticker || "").toUpperCase().trim();
    if (!ticker) return fail(res, 400, "ticker query parameter is required");

    const cacheKey = "sentiment:" + ticker;
    const cached = getCache(cacheKey);
    if (cached) return send(res, 200, cached, { cached: true, ttl: TTL });

    const [redditPosts, newsPosts] = await Promise.all([
      fetchRedditPosts(ticker),
      fetchAllNews(ticker),
    ]);

    const allPosts = [...redditPosts, ...newsPosts];
    const posts = allPosts.length > 0 ? allPosts : [
      { title: ticker + " stock discussion", text: "investors watching " + ticker + " closely today" },
      { title: ticker + " market analysis", text: "analysts reviewing " + ticker + " performance" },
    ];

    const analysis = await analyzeSentiment(ticker, posts);
    const result = {
      ticker,
      ...analysis,
      sources: {
        reddit: redditPosts.length,
        news:   newsPosts.length,
      },
    };

    setCache(cacheKey, result, TTL);
    return send(res, 200, result, { cached: false, ttl: TTL });
  } catch (err) {
    next(err);
  }
});

module.exports = router;