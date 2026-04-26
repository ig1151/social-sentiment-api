"use strict";
const express = require("express");
const router = express.Router();
const axios = require("axios");
const { analyzeSentiment } = require("../services/sentimentService");

const SUPPORTED_SYMBOLS = [
  "BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE", "AVAX",
  "LINK", "DOT", "MATIC", "UNI", "ARB", "OP", "SUI", "APT",
  "PEPE", "WIF", "BONK", "INJ", "TIA", "ATOM", "NEAR", "FET"
];

async function fetchCryptoPosts(symbol) {
  try {
    const res = await axios.post(
      "https://api.tavily.com/search",
      {
        api_key: process.env.TAVILY_API_KEY,
        query: `${symbol} cryptocurrency price sentiment community 2026`,
        max_results: 10,
        search_depth: "basic",
        include_answer: false,
        topic: "finance",
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 12000,
      }
    );
    return (res.data.results || []).map(r => ({
      source: r.url,
      title: r.title,
      text: r.content || "",
      score: 0,
    }));
  } catch (err) {
    console.warn("[crypto] Tavily fetch failed:", err.message);
    return [];
  }
}

async function fetchTrendingPosts() {
  try {
    const res = await axios.post(
      "https://api.tavily.com/search",
      {
        api_key: process.env.TAVILY_API_KEY,
        query: "crypto trending coins community mentions today 2026",
        max_results: 10,
        search_depth: "basic",
        include_answer: false,
        topic: "finance",
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 12000,
      }
    );
    return (res.data.results || []).map(r => ({
      title: r.title,
      text: r.content || "",
    }));
  } catch (err) {
    console.warn("[crypto-trending] Tavily fetch failed:", err.message);
    return [];
  }
}

// GET /crypto-sentiment?symbol=BTC
router.get("/", async (req, res) => {
  const symbol = (req.query.symbol || "").toUpperCase();
  if (!symbol) return res.status(400).json({ error: "symbol is required" });
  if (!SUPPORTED_SYMBOLS.includes(symbol)) {
    return res.status(400).json({
      error: `Unsupported symbol "${symbol}"`,
      supportedSymbols: SUPPORTED_SYMBOLS,
    });
  }

  try {
    const posts = await fetchCryptoPosts(symbol);
    if (posts.length === 0) {
      return res.status(404).json({ error: `No data found for ${symbol}` });
    }

    const sentiment = await analyzeSentiment(`${symbol} cryptocurrency`, posts);

    return res.json({
      success: true,
      data: {
        symbol,
        sentiment_score: sentiment.sentiment_score,
        trend: sentiment.trend,
        signal: sentiment.signal,
        confidence: sentiment.confidence,
        reason: sentiment.reason,
        top_themes: sentiment.top_themes,
        mentions: posts.length,
        sources: [...new Set(posts.map(p => p.source))],
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[crypto-sentiment] error:", err.message);
    return res.status(500).json({ error: "Failed to analyze crypto sentiment" });
  }
});

// GET /crypto-sentiment/trending
router.get("/trending", async (req, res) => {
  try {
    const posts = await fetchTrendingPosts();
    const counts = {};

    for (const p of posts) {
      const text = `${p.title} ${p.text}`.toUpperCase();
      for (const symbol of SUPPORTED_SYMBOLS) {
        const matches = text.match(new RegExp(`\\b${symbol}\\b`, "g"));
        if (matches) counts[symbol] = (counts[symbol] || 0) + matches.length;
      }
    }

    const trending = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([symbol, mentions], i) => ({ rank: i + 1, symbol, mentions }));

    return res.json({
      success: true,
      data: {
        trending,
        source: "Tavily web search",
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[crypto-trending] error:", err.message);
    return res.status(500).json({ error: "Failed to fetch crypto trending" });
  }
});

module.exports = router;