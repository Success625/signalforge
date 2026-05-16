# SignalForge 🚀

![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![pnpm](https://img.shields.io/badge/pnpm-10.33.0-orange.svg)

> **SignalForge** is an AI-powered crypto monitoring tool built to solve the "early meme discovery" and "smart money tracking" problem. It identifies consistently profitable Solana wallets via Birdeye's API, monitors their on-chain moves in real-time, validates the token's safety (holder concentration), and delivers explained signals to a public Telegram channel.

## Tech Stack

- **Node.js** - Runtime environment (ESM modules)
- **pnpm** - Package manager
- **@google/generative-ai** - For the AI Insight Layer
- **axios** - For API and data fetching
- **node-cron** - Task scheduling
- **Next.js** - Dashboard frontend
- **Drizzle ORM & Postgres** - Database management

## Key Features

1.  **Smart Money Feed:** Profitable wallets buying, token accumulation activity, and whale entries.
2.  **Narrative Detection:** Tracks trending sectors, AI meme coins, ecosystem momentum, and capital rotation.
3.  **AI Insight Layer:** Converts raw data into readable explanations, risk summaries, and conviction scores.
4.  **Signal Dashboard:** Displays top opportunities, momentum score, risk score, and smart money score.
5.  **Telegram Alert Bot:** Sends formatted alerts automatically to a public Telegram channel.

## Architecture & Technical Depth

SignalForge runs as a resilient Node.js background process:

- **State Management:** Uses **Supabase (Postgres)** via **Drizzle ORM** to hydrate wallet states and `lastSeenTime` markers on boot, ensuring no signals are missed if the bot restarts.
- **Rate Limit Handling:** Implements an intelligent `withRetry429` exponential backoff wrapper around Birdeye API calls to respect rate limits during high-concurrency wallet scanning.
- **Pipeline:**
  1. **Cron 1 (6h):** Retrieves/refreshes historically profitable wallets.
  2. **Cron 2 (3m):** Scans for new swaps (`tx_type: swap`).
  3. **Safety Layer:** Filters stablecoins, assesses token concentration (`scoreToken`), and drops low-volume noise.
  4. **AI Insight Layer:** Feeds the curated swap into Gemini 2.0 Flash to synthesize a narrative-driven conviction alert.

_Note: The architecture incorporates a Next.js frontend to visualize the signals in real-time._

## 🦅 Birdeye API Integration

This project heavily leverages the Birdeye Data API to surface real-time, actionable alpha. Specifically, we utilize:

- **`/trader/txs/seek_by_time`**: Used to scan historical and real-time transaction data from profitable wallets. We handle exponential backoffs (429s) and bookmark the `lastSeenTime` to efficiently poll for new swaps.
- **`/defi/v3/token/holder`**: Used in our anti-rug/safety filter. Before a signal is emitted, we check the top 10 holders. If the top 3 holders own >60% of the supply, the token is flagged as highly concentrated and the signal is dropped.

## Project Structure

```
├── index.js      # Main entry point; sets up cron jobs and coordinates pipelines
├── monitor.js    # Interacts with blockchain APIs (like Birdeye) to fetch recent swaps
├── signal.js     # Processes raw swap data through the AI generation layer
├── telegram.js   # Telegram bot formatting and dispatching
├── wallets.js    # Handles wallet list refreshing and tracking logic
├── dashboard/    # Next.js frontend dashboard application
├── db/           # Drizzle ORM schema and database setup
└── package.json  # NPM scripts and dependencies
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- [pnpm](https://pnpm.io/installation) installed locally

### Installation & Setup

1. Clone the repository and navigate to the project directory:

   ```bash
   git clone https://github.com/Success625/signalforge.git
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
- [Railway](https://railway.app) — backend hosting
- [Vercel](https://vercel.com) — frontend hosting

---

## Author

Built by Adeniyi Success for the
[Birdeye Data BIP Competition Sprint 4](https://superteam.fun/earn/listing/birdeye-data-4-week-bip-competition-sprint-4/)

Twitter: [@adeniyisuccess\_](https://x.com/adeniyisuccess_)

---

_Not financial advice. This tool surfaces on-chain data patterns
for informational purposes only._
