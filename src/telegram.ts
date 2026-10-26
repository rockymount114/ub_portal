import { AppConfig } from './config';

export interface TelegramSendResult {
  success: boolean;
  error?: string;
}

export async function sendTelegramMessage(
  config: AppConfig,
  text: string
): Promise<TelegramSendResult> {
  if (!config.telegramBotToken || !config.telegramChatId) {
    const errorMsg = 'Telegram credentials not configured (TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID missing in .env)';
    console.error(`[Telegram] ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: config.telegramChatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const data = (await response.json()) as { ok: boolean; description?: string; error_code?: number };

    if (!data.ok) {
      const err = `Telegram API error (${data.error_code}): ${data.description}`;
      console.error(`[Telegram] ${err}`);
      return { success: false, error: err };
    }

    return { success: true };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    console.error(`[Telegram] Failed to send message: ${error}`);
    return { success: false, error };
  }
}
