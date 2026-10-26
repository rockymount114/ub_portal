# UB Portal Monitor

A TypeScript-based monitoring daemon that checks the health and availability of the utility billing portal (`https://myutilities.rockymountnc.gov/app/login.jsp`) and sends instant Telegram alerts on downtime and recovery.

---

## Features

- **Combined Health Check**: Validates HTTP 200 status code **and** checks for error phrases such as `"The requested page could not be found"`.
- **State Transition Alerts**: Alerts when the site goes DOWN, and alerts when the site RECOVERS to UP.
- **Debounced Sensitivity**: Requires 2 consecutive check failures (or successes) to trigger alerts, eliminating false alarms from momentary network blips.
- **Telegram Integration**: Direct Telegram Bot API integration using native `fetch` (zero heavy external dependencies).
- **Startup Notification**: Immediately confirms daemon launch and reports initial status.
- **PM2 Ready**: Includes `ecosystem.config.cjs` for 24/7 background process management and auto-restart.

---

## 1. Quick Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Configure Environment Variables
Open `.env` (or copy from `.env.example`) and fill in your Telegram Bot Token and Chat ID:

```ini
# Target URL to monitor
TARGET_URL=https://myutilities.rockymountnc.gov/app/login.jsp

# Telegram Bot Credentials
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
TELEGRAM_CHAT_ID=-1001234567890

# Monitoring Settings
CHECK_INTERVAL_SECONDS=60
CONSECUTIVE_THRESHOLD=2
REQUEST_TIMEOUT_SECONDS=10
```

#### How to get Telegram Bot Credentials:
1. **Bot Token**: Message [@BotFather](https://t.me/BotFather) on Telegram $\rightarrow$ `/newbot` $\rightarrow$ copy the API token.
2. **Chat ID**: Message [@userinfobot](https://t.me/userinfobot) or [@raw_data_bot](https://t.me/raw_data_bot) to get your numerical chat ID (or add your bot to a group and get the group ID).
3. **Start the Bot**: Make sure to send `/start` to your new bot once in Telegram so it has permission to message you.

### Step 3: Test Telegram Configuration
Build the project and run the standalone test script:
```bash
npm run build
npm run test-telegram
```
You should receive a test message in your Telegram chat immediately.

---

## 2. Running with PM2

### Start the Service:
```bash
pm2 start ecosystem.config.cjs
```

### View Live Logs:
```bash
pm2 logs ub-portal-monitor
```

### Check Status:
```bash
pm2 status
```

### Restart / Stop:
```bash
pm2 restart ub-portal-monitor
pm2 stop ub-portal-monitor
```

### Save PM2 State (to restart on system reboot):
```bash
pm2 save
```

---

## 3. Scripts

| Command | Description |
|---|---|
| `npm run build` | Compiles TypeScript source files into `dist/` |
| `npm run watch` | Watches for code changes and compiles in real-time |
| `npm start` | Runs the compiled monitor daemon directly (`node dist/index.js`) |
| `npm run test-telegram` | Sends a one-time test message to Telegram |
| `npm run test-check` | Performs a single check against the target URL and prints output |
