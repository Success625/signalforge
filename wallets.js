import axios from "axios";
import { sleep, withRetry429 } from "./monitor.js";

const BASE_URL = "https://public-api.birdeye.so";
const headers = {
  "X-API-KEY": process.env.BIRDEYE_API_KEY,
  "x-chain": "solana",
  accept: "application/json",
};

const PAGE_SIZE = 10;
const MAX_WALLETS = Number.parseInt(process.env.MAX_WALLETS ?? "20", 10);
const MAX_WALLETS_SAFE = Number.isFinite(MAX_WALLETS) && MAX_WALLETS > 0 ? MAX_WALLETS : 20;
const PAGE_OFFSETS = [0, 10];
const PAGE_DELAY_MS = 600;

// In-memory store, refreshed every 6 hours
let trackedWallets = [];

export async function refreshWallets() {
  try {
    console.log("[wallets] Refreshing top wallet list...");

    const items = [];

    for (const offset of PAGE_OFFSETS) {
      try {
        const res = await withRetry429(
          () =>
            axios.get(`${BASE_URL}/trader/gainers-losers`, {
              headers,
              params: {
                type: "1W",
                sort_by: "PnL",
                sort_type: "desc",
                limit: PAGE_SIZE,
                offset,
              },
            }),
          { label: `wallets offset ${offset}` },
        );

        items.push(...(res.data?.data?.items ?? []));
      } catch (err) {
        console.error(
          `[wallets] Failed to fetch wallets at offset ${offset}:`,
          err.response?.data ?? err.message ?? err,
        );
      }

      await sleep(PAGE_DELAY_MS);
    }

    // Filter out likely bots (insane trade counts) and low PnL wallets
    const filtered = items.filter((w) => w.trade_count < 50000 && w.pnl > 100000);
    const deduped = [];
    const seen = new Set();

    for (const wallet of filtered) {
      if (seen.has(wallet.address)) continue;
      seen.add(wallet.address);
      deduped.push({
        address: wallet.address,
        pnl: wallet.pnl,
        tradeCount: wallet.trade_count,
        winRate: wallet.win_rate,
      });
    }

    if (deduped.length === 0) {
      console.warn("[wallets] Wallet refresh returned empty; keeping existing list");
      return trackedWallets;
    }

    trackedWallets = deduped.slice(0, MAX_WALLETS_SAFE);

    console.log(`[wallets] Tracking ${trackedWallets.length} wallets`);
    return trackedWallets;
  } catch (err) {
    console.error(
      "[wallets] Failed to refresh wallets:",
      err.response?.data ?? err.message ?? err,
    );
    return trackedWallets;
  }
}

export function setTrackedWallets(wallets) {
  if (!Array.isArray(wallets)) return;
  trackedWallets = wallets;
}

export function getTrackedWallets() {
  return trackedWallets;
}
