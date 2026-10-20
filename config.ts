import dotenv from 'dotenv';
dotenv.config();

// ============================================================================
export const CONFIG = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  MONGO_URI: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/botkit-examples",
  FLARESEND_API_KEY: process.env.FLARESEND_API_KEY || "",
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  WEBHOOK_SECRET: process.env.TELEGRAM_WEBHOOK_SECRET || "medcare_telegram_secret",
  API_BASE_URL: process.env.TELEGRAM_API_BASE_URL || "https://api.telegram.org",
};
