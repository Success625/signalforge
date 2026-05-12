# SignalForge 🚀

![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![pnpm](https://img.shields.io/badge/pnpm-10.33.0-orange.svg)

> **SignalForge** is an AI-powered crypto monitoring tool that identifies consistently profitable Solana wallets via Birdeye's API, monitors their moves in real-time, and delivers explained signals (what they bought, their win rates, why it might matter) to a public Telegram channel. The GPT layer makes it an actionable signal, not just a blind mirror.

## Tech Stack

- **Node.js** - Runtime environment (ESM modules)
- **pnpm** - Package manager
- **@google/generative-ai** - For the AI Insight Layer
- **axios** - For API and data fetching
- **node-cron** - Task scheduling
- _Coming soon: Next.js (Dashboard frontend) and Hono (Edge/Backend server)_

## Key Features

1.  **Smart Money Feed:** Profitable wallets buying, token accumulation activity, and whale entries.
2.  **Narrative Detection:** Tracks trending sectors, AI meme coins, ecosystem momentum, and capital rotation.
3.  **AI Insight Layer:** Converts raw data into readable explanations, risk summaries, and conviction scores.
4.  **Signal Dashboard (Upcoming):** Displays top opportunities, momentum score, risk score, and smart money score.
5.  **Telegram Alert Bot:** Sends formatted alerts automatically to a public Telegram channel.

## Architecture

SignalForge currently runs as a standalone Node.js daemon using cron jobs to poll for changes:

1. Every 6 hours: Retrieves and refreshes the list of historically profitable wallets.
2. Every 3 minutes: Scans the specified wallets for new swaps.
3. Data processing stream fetching new tokens, querying the AI service for insights, and emitting curated alerts out to the Telegram Bot.

_Note: Future architecture will incorporate a Hono API and a Next.js frontend to visualize the signals in real-time._

## Project Structure

```
├── index.js      # Main entry point; sets up cron jobs and coordinates pipelines
├── monitor.js    # Interacts with blockchain APIs (like Birdeye) to fetch recent swaps
├── signal.js     # Processes raw swap data through the AI generation layer
├── telegram.js   # Telegram bot formatting and dispatching
├── wallets.js    # Handles wallet list refreshing and tracking logic
└── package.json  # NPM scripts and dependencies
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- [pnpm](https://pnpm.io/installation) installed locally

### Installation & Setup

1. Clone the repository and navigate to the project directory:

   ```bash
   git clone <repository-url> signalforge
   cd signalforge
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Configure environment variables:
   Create a `.env` file (or copy from `.env.example` if available) and add the necessary API keys (`TELEGRAM_BOT_TOKEN`, `GEMINI_API_KEY`, API endpoint keys, etc.)

   ```bash
   cp .env.example .env
   ```

4. Run the monitor:
   ```bash
   node index.js
   ```

---

## Built With

- [Birdeye Data API](https://bds.birdeye.so) — onchain data infrastructure
- [Google Gemini](https://aistudio.google.com/) — AI signal explanation
- [Telegram Bot API](https://core.telegram.org/bots/api) — signal delivery
- [Railway](https://railway.app) — free hosting

---

## Author

Built by Adeniyi Success for the
[Birdeye Data BIP Competition Sprint 4](https://superteam.fun/earn/listing/birdeye-data-4-week-bip-competition-sprint-4/)

Twitter: [@adeniyisuccess\_](https://x.com/adeniyisuccess_)

---

_Not financial advice. This tool surfaces on-chain data patterns
for informational purposes only._
