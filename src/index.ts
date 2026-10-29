import { loadConfig } from './config';
import { checkUrl, StatusTracker } from './monitor';
import { sendTelegramMessage } from './telegram';

function formatTimestamp(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
  }).formatToParts(new Date());

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${value('year')}-${value('month')}-${value('day')} ` +
    `${value('hour')}:${value('minute')}:${value('second')} ` +
    `${value('timeZoneName')}`;
}


async function main() {
  const config = loadConfig();
  console.log(`[${formatTimestamp()}] Starting UB Portal Monitor...`);
  console.log(`[Config] Target URL: ${config.targetUrl}`);
  console.log(`[Config] Interval: ${config.checkIntervalMs / 1000}s | Threshold: ${config.consecutiveThreshold} | Timeout: ${config.requestTimeoutMs / 1000}s`);

  if (!config.telegramBotToken || !config.telegramChatId) {
    console.warn(`[Config] WARNING: Telegram Bot Token or Chat ID is not configured in .env!`);
    console.warn(`[Config] Telegram alerts will be skipped until .env is filled.`);
  }

  const tracker = new StatusTracker(config.consecutiveThreshold);

  // Initial check on boot
  console.log(`[${formatTimestamp()}] Performing initial check...`);
  const initialResult = await checkUrl(config);
  const initialState = initialResult.isHealthy ? 'UP' : 'DOWN';
  tracker.setInitialState(initialState);

  const initialStatusEmoji = initialResult.isHealthy ? '✅' : '🚨';
  const initialStatusDesc = initialResult.isHealthy
    ? `ONLINE (HTTP ${initialResult.statusCode}, ${initialResult.responseTimeMs}ms)`
    : `OFFLINE (${initialResult.reason || 'Check failed'}, ${initialResult.responseTimeMs}ms)`;

  console.log(`[${formatTimestamp()}] Initial Status: ${initialState} - ${initialStatusDesc}`);

  // Send startup notification
  const startupMessage = [
    `🚀 <b>UB Portal Monitor Started</b>`,
    ``,
    `🔗 <b>Target:</b> <code>${config.targetUrl}</code>`,
    `📊 <b>Initial Status:</b> ${initialStatusEmoji} ${initialStatusDesc}`,
    `⏱️ <b>Check Interval:</b> every ${config.checkIntervalMs / 1000}s`,
    `🛡️ <b>Debounce Threshold:</b> ${config.consecutiveThreshold} consecutive checks`,
    `📅 <b>Time:</b> ${formatTimestamp()}`,
  ].join('\n');

  await sendTelegramMessage(config, startupMessage);

  let isCheckRunning = false;

  const runCheck = async () => {
    if (isCheckRunning) return;
    isCheckRunning = true;

    try {
      const result = await checkUrl(config);
      const transition = tracker.evaluate(result);

      const logStatus = result.isHealthy ? 'PASS' : 'FAIL';
      const detail = result.isHealthy
        ? `HTTP ${result.statusCode} (${result.responseTimeMs}ms)`
        : `${result.reason} (${result.responseTimeMs}ms)`;

      console.log(
        `[${formatTimestamp()}] [${logStatus}] State: ${tracker.getCurrentState()} | Failures: ${tracker.getConsecutiveFailures()} | Passes: ${tracker.getConsecutiveSuccesses()} | ${detail}`
      );

      if (transition === 'TRANSITION_TO_DOWN') {
        console.warn(`[${formatTimestamp()}] TRIGGERING DOWN ALERT to Telegram!`);
        const downMessage = [
          `🚨 <b>ALERT: UB Portal Website is DOWN!</b>`,
          ``,
          `🔗 <b>Target:</b> <code>${config.targetUrl}</code>`,
          `❌ <b>Issue:</b> ${result.reason || 'Service unreachable'}`,
          `⏱️ <b>Response Time:</b> ${result.responseTimeMs}ms`,
          `⚠️ <b>Failed Checks:</b> ${tracker.getConsecutiveFailures()} consecutive times`,
          `📅 <b>Timestamp:</b> ${formatTimestamp()}`,
        ].join('\n');

        await sendTelegramMessage(config, downMessage);
      } else if (transition === 'TRANSITION_TO_UP') {
        console.log(`[${formatTimestamp()}] TRIGGERING RECOVERY ALERT to Telegram!`);
        const upMessage = [
          `✅ <b>RESOLVED: UB Portal Website is Back ONLINE!</b>`,
          ``,
          `🔗 <b>Target:</b> <code>${config.targetUrl}</code>`,
          `📶 <b>Status:</b> HTTP ${result.statusCode} OK`,
          `⏱️ <b>Response Time:</b> ${result.responseTimeMs}ms`,
          `✔️ <b>Passed Checks:</b> ${tracker.getConsecutiveSuccesses()} consecutive times`,
          `📅 <b>Timestamp:</b> ${formatTimestamp()}`,
        ].join('\n');

        await sendTelegramMessage(config, upMessage);
      }
    } catch (err: unknown) {
      console.error(`[${formatTimestamp()}] Unexpected error in check loop:`, err);
    } finally {
      isCheckRunning = false;
    }
  };

  const intervalId = setInterval(runCheck, config.checkIntervalMs);

  const shutdown = async (signal: string) => {
    console.log(`\n[${formatTimestamp()}] Received ${signal}. Shutting down monitor daemon...`);
    clearInterval(intervalId);
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
