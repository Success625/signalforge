import axios from "axios";

const BASE_URL = "https://public-api.birdeye.so";
const headers = {
  "X-API-KEY": process.env.BIRDEYE_API_KEY,
  "x-chain": "solana",
  accept: "application/json",
};

// In-memory store, refreshed every 6 hours
let trackedWallets = [];

export async function refreshWallets() {
  try {
    console.log("[wallets] Refreshing top wallet list...");

    const res = await axios.get(`${BASE_URL}/trader/gainers-losers`, {
      headers,
      params: {
        type: "1W",
        sort_by: "PnL",
        sort_type: "desc",
        limit: 10,
      },
    });

    const items = res.data?.data?.items ?? [];

    // Filter out likely bots (insane trade counts) and low PnL wallets
    trackedWallets = items
      .filter((w) => w.trade_count < 50000 && w.pnl > 100000)
      .map((w) => w.address);

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
