"use strict";
const axios = require("axios");

const SUBREDDITS = ["wallstreetbets", "investing", "stocks", "options"];

async function fetchRedditPosts(ticker) {
  const results = [];
  for (const sub of SUBREDDITS) {
    try {
      const res = await axios.get(
        `https://www.reddit.com/r/${sub}/search.json`,
        {
          params: { q: ticker, sort: "new", limit: 25, t: "day" },
          headers: { "User-Agent": "social-sentiment-api/1.0" },
          timeout: 5000,
        }
      );
      const posts = res.data?.data?.children || [];
      posts.forEach(({ data: p }) => {
        results.push({
          source: `reddit/r/${sub}`,
          title: p.title,
          text: p.selftext || "",
          score: p.score,
          url: `https://reddit.com${p.permalink}`,
          createdAt: new Date(p.created_utc * 1000).toISOString(),
        });
      });
    } catch (err) {
      console.warn(`[reddit] failed for r/${sub}:`, err.message);
    }
  }
  return results;
}

module.exports = { fetchRedditPosts };