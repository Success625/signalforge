import axios from "axios";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

function formatSignal(signal) {
  const date = new Date(signal.timestamp * 1000).toUTCString();
  const tradeSize = `$${Math.round(signal.volumeUsd).toLocaleString()}`;
  const birdeyeLink = `https://birdeye.so/token/${signal.tokenAddress}?chain=solana`;
  const walletLink = `https://birdeye.so/profile/${signal.wallet}?chain=solana`;
  const shortWallet = `${signal.wallet.slice(0, 4)}...${signal.wallet.slice(-4)}`;
  const walletDisplay = `[${shortWallet}](${walletLink})`;

  return `🚨 *Smart Wallet Signal*
> *Wallet:* ${walletDisplay}
> *Token:* $${signal.tokenSymbol}
> *Trade Size:* ~${tradeSize}
> *Signal Intel:* ${signal.explanation}

🔗 [View on Birdeye](${birdeyeLink})
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

function formatPnl(value) {
  const numeric = Number(value ?? 0);
  const absValue = Math.abs(numeric);
  const formatted = `$${Math.round(absValue).toLocaleString()}`;
  return numeric < 0 ? `-${formatted}` : formatted;
}

export async function sendLeaderboard(wallets) {
  try {
    const roster = (wallets ?? [])
      .filter((wallet) => wallet?.address)
      .sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0))
      .slice(0, 3);

    if (roster.length === 0) {
      console.log("[telegram] No wallets available for leaderboard");
      return;
    }

    const lines = roster.map((wallet, index) => {
      const shortWallet = `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}`;
      const profileLink = `https://birdeye.so/profile/${wallet.address}?chain=solana`;
      const pnlLabel = formatPnl(wallet.pnl);

      return `> *${index + 1}.* [${shortWallet}](${profileLink}) — *PnL:* ${pnlLabel} — [Trades](${profileLink})`;
    });

    const text = `📌 *Roster Update*
> Top 3 wallets by weekly PnL
${lines.join("\n")}`;

    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    });

    console.log("[telegram] Leaderboard sent");
  } catch (err) {
    console.error(
      "[telegram] Failed to send leaderboard:",
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
