import { loadConfig } from './config';
import { sendTelegramMessage } from './telegram';

async function testTelegram() {
  console.log('--- Telegram Notification Test ---');
  const config = loadConfig();

  if (!config.telegramBotToken || !config.telegramChatId) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing in .env');
    console.log('\nPlease configure your .env file:');
    console.log('1. TELEGRAM_BOT_TOKEN: from @BotFather');
    console.log('2. TELEGRAM_CHAT_ID: your chat ID (from @userinfobot or channel ID)');
    process.exit(1);
  }

  console.log(`Bot Token: ${config.telegramBotToken.substring(0, 8)}...`);
  console.log(`Chat ID: ${config.telegramChatId}`);
  console.log('Sending test message to Telegram...');

  const message = [
    `🔔 <b>Test Notification</b>`,
    ``,
    `Your Telegram bot configuration is working properly!`,
    `Target monitored: <code>${config.targetUrl}</code>`,
    `Time: <code>${new Date().toISOString()}</code>`,
  ].join('\n');

  const result = await sendTelegramMessage(config, message);

  if (result.success) {
    console.log('✅ Test message sent successfully! Check your Telegram chat.');
    process.exit(0);
  } else {
    console.error(`❌ Failed to send test message: ${result.error}`);
    process.exit(1);
  }
}

testTelegram().catch((err) => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
