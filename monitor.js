import axios from "axios";

const BASE_URL = "https://public-api.birdeye.so";
const headers = {
  "X-API-KEY": process.env.BIRDEYE_API_KEY,
  "x-chain": "solana",
  accept: "application/json",
};

// Tracks the latest tx_hash seen per wallet to avoid reprocessing
const lastSeen = {};

// Tokens to ignore — not signals, just noise
const IGNORE_TOKENS = new Set([
  "So11111111111111111111111111111111111111112", // SOL
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", // mSOL
  "bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1", // bSOL
]);

export async function fetchNewSwaps(walletAddress) {
  try {
    const res = await axios.get(`${BASE_URL}/trader/txs/seek_by_time`, {
      headers,
      params: {
        address: walletAddress,
        tx_type: "swap",
        limit: 5,
      },
    });

    const items = res.data?.data?.items ?? [];

    // Deduplicate by tx_hash first
    const seenHashes = new Set();
    const uniqueItems = items.filter((item) => {
      if (seenHashes.has(item.tx_hash)) return false;
      seenHashes.add(item.tx_hash);
      return true;
    });

    // Filter to only new swaps since last check
    const lastTxHash = lastSeen[walletAddress];
    const newItems = lastTxHash
      ? uniqueItems.filter(
          (item) =>
            item.tx_hash !== lastTxHash &&
            item.block_unix_time > (lastSeen[`${walletAddress}_time`] ?? 0),
        )
      : uniqueItems.slice(0, 1); // first run — only take latest to avoid spam

    // Update last seen
    if (uniqueItems.length > 0) {
      lastSeen[walletAddress] = uniqueItems[0].tx_hash;
      lastSeen[`${walletAddress}_time`] = uniqueItems[0].block_unix_time;
    }

    // Extract only token buys (type_swap === 'to') that aren't noise tokens
    const signals = newItems
      .filter((item) => {
        const token = item.base;
        return (
          token?.type_swap === "to" &&
          !IGNORE_TOKENS.has(token?.address) &&
          item.volume_usd >= 1000 // minimum $1k trade size
        );
      })
      .map((item) => ({
        wallet: item.owner,
        tokenSymbol: item.base.symbol,
        tokenAddress: item.base.address,
        volumeUsd: item.volume_usd,
        txHash: item.tx_hash,
        source: item.source,
        timestamp: item.block_unix_time,
      }));

    return signals;
  } catch (err) {
    console.error(
      `[monitor] Failed to fetch swaps for ${walletAddress}:`,
      err.response?.data ?? err.response?.status ?? err.message ?? err,
    );
    return [];
  }
}
