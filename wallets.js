import axios from "axios";

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

// In-memory store, refreshed every 6 hours
let trackedWallets = [];

export async function refreshWallets() {
  try {
    console.log("[wallets] Refreshing top wallet list...");

    const results = await Promise.allSettled(
      PAGE_OFFSETS.map((offset) =>
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
      ),
    );

    const items = results.flatMap((result) =>
      result.status === "fulfilled" ? (result.value.data?.data?.items ?? []) : [],
    );

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

export function getTrackedWallets() {
  return trackedWallets;
}
