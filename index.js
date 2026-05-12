import "dotenv/config";
import cron from "node-cron";
import { refreshWallets, getTrackedWallets } from "./wallets.js";
import { fetchNewSwaps } from "./monitor.js";
import { processSignal } from "./signal.js";
import { sendSignal, sendStartupMessage } from "./telegram.js";

// Pause helper for rate limiting
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runMonitorCycle() {
  const wallets = getTrackedWallets();

  if (wallets.length === 0) {
    console.log("[index] No wallets to monitor yet");
    return;
  }

  console.log(`[index] Checking ${wallets.length} wallets for new swaps...`);

  for (const wallet of wallets) {
    try {
      const swaps = await fetchNewSwaps(wallet);

      for (const swap of swaps) {
        const signal = await processSignal(swap);

        if (signal) {
          await sendSignal(signal);
          console.log(
            `[index] Signal fired: ${signal.tokenSymbol} | $${Math.round(signal.volumeUsd).toLocaleString()}`,
          );
        }

        await sleep(2000); // 2s between tokens — respect rate limits
      }

      await sleep(1000); // 1s between wallets
    } catch (err) {
      console.error(`[index] Error processing wallet ${wallet}:`, err.message);
    }
  }
}

async function main() {
  console.log("[index] Smart Wallet Signal Feed starting...");

  // Load wallets immediately on boot
  await refreshWallets();

  // Send startup ping to Telegram
  await sendStartupMessage();

  // Run first monitor cycle immediately
  await runMonitorCycle();

  // Refresh wallet list every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    console.log("[index] Running scheduled wallet refresh...");
    await refreshWallets();
  });

  // Monitor swaps every 3 minutes
  cron.schedule("*/3 * * * *", async () => {
    console.log("[index] Running scheduled monitor cycle...");
    await runMonitorCycle();
  });

  console.log("[index] Cron jobs scheduled. Bot is running.");
}

main();
