"use strict";
const axios = require("axios");
const RSSParser = require("rss-parser");
const parser = new RSSParser();

async function fetchNewsApiArticles(ticker) {
  try {
    const res = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: ticker,
        language: "en",
        sortBy: "publishedAt",
        pageSize: 20,
        from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      headers: {
        "X-Api-Key": process.env.NEWS_API_KEY,
        "User-Agent": "Mozilla/5.0",
      },
      timeout: 5000,
    });
    const articles = res.data?.articles || [];
    if (articles.length === 0) return [];
    return articles.map(a => ({
      source: "newsapi/" + (a.source?.name || "unknown"),
      title: a.title || "",
      text: a.description || "",
      url: a.url,
      createdAt: a.publishedAt,
    }));
  } catch (err) {
    console.warn("[newsapi] failed:", err.message);
    return [];
  }
}

async function fetchRSSArticles(ticker) {
  const feeds = [
    "https://feeds.finance.yahoo.com/rss/2.0/headline?s=" + ticker + "&region=US&lang=en-US",
    "https://www.investing.com/rss/news_25.rss",
  ];
  const results = [];
  for (const url of feeds) {
    try {
      const feed = await parser.parseURL(url);
      feed.items.slice(0, 10).forEach(item => {
        const text = (item.title || "") + " " + (item.contentSnippet || "");
        if (text.toLowerCase().includes(ticker.toLowerCase())) {
          results.push({
            source: "rss/" + (feed.title || "feed"),
            title: item.title || "",
            text: item.contentSnippet || "",
            url: item.link,
            createdAt: item.pubDate,
          });
        }
      });
    } catch (err) {
      console.warn("[rss] failed for " + url + ":", err.message);
    }
  }
  return results;
}

async function fetchAllNews(ticker) {
  const [newsApi, rss] = await Promise.all([
    fetchNewsApiArticles(ticker),
    fetchRSSArticles(ticker),
  ]);
  return [...newsApi, ...rss];
}

module.exports = { fetchAllNews };