import axios from "axios";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

function formatSignal(signal) {
  const date = new Date(signal.timestamp * 1000).toUTCString();
  const tradeSize = `$${Math.round(signal.volumeUsd).toLocaleString()}`;
  const birdeyeLink = `https://birdeye.so/token/${signal.tokenAddress}?chain=solana`;
  const shortWallet = `${signal.wallet.slice(0, 4)}...${signal.wallet.slice(-4)}`;

  return `🚨 *Smart Wallet Signal*

💼 *Wallet:* \`${shortWallet}\`
🪙 *Token:* $${signal.tokenSymbol}
💰 *Trade Size:* ~${tradeSize}
🔗 [View on Birdeye](${birdeyeLink})

🤖 *Signal Intel:*
${signal.explanation}

⏰ ${date}`;
}

export async function sendSignal(signal) {
  try {
    const text = formatSignal(signal);

    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: false,
    });

    console.log(`[telegram] Signal sent for ${signal.tokenSymbol}`);
  } catch (err) {
    console.error(
      "[telegram] Failed to send message:",
      err.response?.data ?? err.message,
    );
  }
}

export async function sendStartupMessage() {
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: `🟢 *Smart Wallet Signal Feed is live*\n\nMonitoring top Solana wallets by weekly PnL.\nSignals post automatically every 3 minutes, 24/7.\n\n_Powered by Birdeye Data + Gemini AI_`,
      parse_mode: "Markdown",
    });
    console.log("[telegram] Startup message sent");
  } catch (err) {
    console.error(
      "[telegram] Startup message failed:",
      err.response?.data ?? err.message,
    );
  }
}
