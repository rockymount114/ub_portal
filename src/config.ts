import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export interface AppConfig {
  targetUrl: string;
  telegramBotToken: string;
  telegramChatId: string;
  checkIntervalMs: number;
  consecutiveThreshold: number;
  requestTimeoutMs: number;
}

export function loadConfig(): AppConfig {
  const targetUrl = process.env.TARGET_URL?.trim() || 'https://myutilities.rockymountnc.gov/app/login.jsp';
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN?.trim() || '';
  const telegramChatId = process.env.TELEGRAM_CHAT_ID?.trim() || '';

  const checkIntervalSeconds = parseInt(process.env.CHECK_INTERVAL_SECONDS || '60', 10);
  const consecutiveThreshold = parseInt(process.env.CONSECUTIVE_THRESHOLD || '2', 10);
  const requestTimeoutSeconds = parseInt(process.env.REQUEST_TIMEOUT_SECONDS || '10', 10);

  return {
    targetUrl,
    telegramBotToken,
    telegramChatId,
    checkIntervalMs: (isNaN(checkIntervalSeconds) ? 60 : checkIntervalSeconds) * 1000,
    consecutiveThreshold: isNaN(consecutiveThreshold) || consecutiveThreshold < 1 ? 2 : consecutiveThreshold,
    requestTimeoutMs: (isNaN(requestTimeoutSeconds) ? 10 : requestTimeoutSeconds) * 1000,
  };
}
