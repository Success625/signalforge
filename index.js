import "dotenv/config";
import cron from "node-cron";
import {
  refreshWallets,
  getTrackedWallets,
  setTrackedWallets,
} from "./wallets.js";
import {
  fetchNewSwaps,
  getLastSeenMarker,
  hydrateLastSeenMarkers,
} from "./monitor.js";
import { processSignal } from "./signal.js";
import { sendLeaderboard, sendSignal, sendStartupMessage } from "./telegram.js";
import {
  insertSignals,
  loadLastSeenMarkers,
  loadTrackedWalletsFromDb,
  upsertLastSeenMarkers,
  upsertTrackedWallets,
} from "./supabase.js";

// Pause helper for rate limiting
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const WALLET_CONCURRENCY = Number.parseInt(
  process.env.WALLET_CONCURRENCY ?? "1",
  10,
);
const WALLET_CONCURRENCY_SAFE =
  Number.isFinite(WALLET_CONCURRENCY) && WALLET_CONCURRENCY > 0
    ? WALLET_CONCURRENCY
    : 1;
const WALLET_DELAY_MS = Number.parseInt(
  process.env.WALLET_DELAY_MS ?? "2000",
  10,
);
const WALLET_DELAY_MS_SAFE =
  Number.isFinite(WALLET_DELAY_MS) && WALLET_DELAY_MS >= 0
    ? WALLET_DELAY_MS
    : 2000;

let isMonitorCycleRunning = false;

async function hydrateFromSupabase() {
  const [wallets, markers] = await Promise.all([
    loadTrackedWalletsFromDb(),
    loadLastSeenMarkers(),
  ]);

  if (wallets.length > 0) {
    setTrackedWallets(wallets);
    console.log(`[index] Hydrated ${wallets.length} wallets from Supabase`);
  }

  const markerCount = Object.keys(markers).length;
  if (markerCount > 0) {
    hydrateLastSeenMarkers(markers);
    console.log(
      `[index] Hydrated ${markerCount} last-seen markers from Supabase`,
    );
  }
}

async function processWallet(wallet) {
  const walletAddress = wallet.address;
  const signalsToPersist = [];

  try {
    const swaps = await fetchNewSwaps(walletAddress);

    for (const swap of swaps) {
      const signal = await processSignal(swap);

      if (signal) {
        await sendSignal(signal);
        console.log(
          `[index] Signal fired: ${signal.tokenSymbol} | $${Math.round(signal.volumeUsd).toLocaleString()}`,
        );
        signalsToPersist.push(signal);
      }

      await sleep(2000); // 2s between tokens — respect rate limits
    }

    const marker = getLastSeenMarker(walletAddress);
    if (marker) {
      await upsertLastSeenMarkers([marker]);
    }

    if (signalsToPersist.length > 0) {
      await insertSignals(signalsToPersist);
    }
  } catch (err) {
    console.error(
      `[index] Error processing wallet ${walletAddress}:`,
      err.message,
    );
  }
}

async function runWalletsWithLimit(walletEntries, limit) {
  const queue = [...walletEntries];
  const workerCount = Math.min(limit, queue.length);

  const workers = Array.from({ length: workerCount }, async () => {
    while (queue.length > 0) {
      const wallet = queue.shift();
      if (!wallet) return;

      await processWallet(wallet);
      await sleep(WALLET_DELAY_MS_SAFE);
    }
  });

  await Promise.allSettled(workers);
}

async function runMonitorCycle() {
  if (isMonitorCycleRunning) {
    console.warn("[index] Monitor cycle overlap detected; skipping this run");
    return;
  }

  isMonitorCycleRunning = true;

  const wallets = getTrackedWallets();

  if (wallets.length === 0) {
    console.log("[index] No wallets to monitor yet");
    isMonitorCycleRunning = false;
    return;
  }

  console.log(`[index] Checking ${wallets.length} wallets for new swaps...`);

  const walletEntries = wallets.map((wallet) =>
    typeof wallet === "string" ? { address: wallet } : wallet,
  );

  try {
    await runWalletsWithLimit(walletEntries, WALLET_CONCURRENCY_SAFE);
  } finally {
    isMonitorCycleRunning = false;
  }
}

async function main() {
  console.log("[index] Smart Wallet Signal Feed starting...");

  await hydrateFromSupabase();

  // Load wallets immediately on boot
  const refreshedWallets = await refreshWallets();
  await upsertTrackedWallets(refreshedWallets);

  // Send startup ping to Telegram
  await sendStartupMessage();

  // Run first monitor cycle immediately
  await runMonitorCycle();

  // Refresh wallet list every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    console.log("[index] Running scheduled wallet refresh...");
    const updatedWallets = await refreshWallets();
    await upsertTrackedWallets(updatedWallets);
    await sendLeaderboard(getTrackedWallets());
  });

  // Monitor swaps every 3 minutes
  cron.schedule("*/3 * * * *", async () => {
    console.log("[index] Running scheduled monitor cycle...");
    await runMonitorCycle();
  });

  console.log("[index] Cron jobs scheduled. Bot is running.");
}

main();
