"use strict";
const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Social Sentiment & Trading Signals API",
      version: "1.0.0",
      description: "Real-time stock sentiment from Reddit & news. AI-powered buy/sell signals for any ticker.",
    },
    servers: [{ url: "https://social-sentiment-api.onrender.com" }],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
      },
    },
    security: [{ ApiKeyAuth: [] }],
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);