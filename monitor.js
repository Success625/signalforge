import axios from "axios";

const BASE_URL = "https://public-api.birdeye.so";
const headers = {
  "X-API-KEY": process.env.BIRDEYE_API_KEY,
  "x-chain": "solana",
  accept: "application/json",
};

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry429(
  requestFn,
  {
    label = "request",
    maxRetries = 4,
    baseDelayMs = 1000,
    maxDelayMs = 20000,
  } = {},
) {
  let attempt = 0;

  while (true) {
    try {
      return await requestFn();
    } catch (err) {
      const status = err?.response?.status;
      const shouldRetry = status === 429 && attempt < maxRetries;

      if (!shouldRetry) {
        throw err;
      }

      const retryAfterHeader = err?.response?.headers?.["retry-after"];
      const retryAfterSeconds = Number.parseFloat(retryAfterHeader);
      const retryAfterDate = Number.isNaN(retryAfterSeconds)
        ? Date.parse(retryAfterHeader ?? "")
        : Number.NaN;

      const retryAfterMs = Number.isFinite(retryAfterSeconds)
        ? Math.max(0, Math.round(retryAfterSeconds * 1000))
        : Number.isFinite(retryAfterDate)
          ? Math.max(0, retryAfterDate - Date.now())
          : null;

      const backoffMs = Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
      const delayMs = retryAfterMs ?? backoffMs;

      console.warn(
        `[monitor] 429 from ${label}. Retry ${attempt + 1}/${maxRetries} in ${delayMs}ms`,
      );

      await sleep(delayMs);
      attempt += 1;
    }
  }
}

// Tracks the latest tx_hash seen per wallet to avoid reprocessing
const lastSeen = {};

export function hydrateLastSeenMarkers(markers) {
  if (!markers) return;

  if (Array.isArray(markers)) {
    for (const marker of markers) {
      if (!marker?.walletAddress) continue;
      lastSeen[marker.walletAddress] = marker.txHash ?? marker.tx_hash ?? null;
      lastSeen[`${marker.walletAddress}_time`] =
        marker.blockUnixTime ?? marker.block_unix_time ?? null;
    }
    return;
  }

  for (const [walletAddress, marker] of Object.entries(markers)) {
    if (!walletAddress) continue;
    lastSeen[walletAddress] = marker?.txHash ?? marker?.tx_hash ?? null;
    lastSeen[`${walletAddress}_time`] =
      marker?.blockUnixTime ?? marker?.block_unix_time ?? null;
  }
}

export function getLastSeenMarker(walletAddress) {
  const txHash = lastSeen[walletAddress];
  const blockUnixTime = lastSeen[`${walletAddress}_time`];

  if (!txHash && !blockUnixTime) return null;

  return {
    walletAddress,
    txHash,
    blockUnixTime,
  };
}

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
    const lastSeenTime = lastSeen[`${walletAddress}_time`];

    const res = await withRetry429(
      () =>
        axios.get(`${BASE_URL}/trader/txs/seek_by_time`, {
          headers,
          params: {
            address: walletAddress,
            tx_type: "swap",
            limit: 100,
            ...(lastSeenTime ? { after_time: lastSeenTime } : {}),
          },
        }),
      { label: `swaps ${walletAddress}` },
    );

    const items = res.data?.data?.items ?? [];

    // Deduplicate by tx_hash first
    const seenHashes = new Set();
    const uniqueItems = items.filter((item) => {
      if (seenHashes.has(item.tx_hash)) return false;
      seenHashes.add(item.tx_hash);
      return true;
    });

    // Birdeye handles after_time filtering; only throttle first run to avoid spam
    const newItems = lastSeenTime ? uniqueItems : uniqueItems.slice(0, 1);

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
