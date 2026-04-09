"use strict";
const axios = require("axios");

async function analyzeSentiment(ticker, posts) {
  const content = posts
    .slice(0, 30)
    .map(p => `${p.title} ${p.text}`.trim())
    .join("\n---\n")
    .slice(0, 8000);

  const prompt = [
    `You are a financial sentiment analysis engine.`,
    `Analyze the following social media posts and news headlines about the stock ticker "${ticker}".`,
    `Return ONLY a valid JSON object with no explanation, no markdown, no backticks:`,
    `{`,
    `  "sentiment_score": <float between -1.0 (very bearish) and 1.0 (very bullish)>,`,
    `  "trend": "<bullish|bearish|neutral>",`,
    `  "mentions": <total number of posts analyzed>,`,
    `  "signal": "<buy|sell|neutral>",`,
    `  "confidence": <float between 0.0 and 1.0>,`,
    `  "reason": "<one sentence explaining the signal>",`,
    `  "top_themes": ["<theme1>", "<theme2>", "<theme3>"]`,
    `}`,
    `Posts to analyze:`,
    content,
  ].join("\n");

  try {
    const res = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
      }
    );

    const text = res.data?.content?.[0]?.text || "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return { ...parsed, mentions: posts.length };
  } catch (err) {
    console.error("[sentiment] AI analysis failed:", err.message);
    return {
      sentiment_score: 0,
      trend: "neutral",
      mentions: posts.length,
      signal: "neutral",
      confidence: 0,
      reason: "Unable to analyze sentiment at this time.",
      top_themes: [],
    };
  }
}

module.exports = { analyzeSentiment };