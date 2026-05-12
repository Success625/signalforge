import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const BASE_URL = "https://public-api.birdeye.so";
const birdeyeHeaders = {
  "X-API-KEY": process.env.BIRDEYE_API_KEY,
  "x-chain": "solana",
  accept: "application/json",
};

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Returns true if token passes safety check
export async function scoreToken(tokenAddress) {
  try {
    const res = await axios.get(`${BASE_URL}/defi/v3/token/holder`, {
      headers: birdeyeHeaders,
      params: {
        address: tokenAddress,
        limit: 10,
      },
    });

    const holders = res.data?.data?.items ?? [];
    if (holders.length === 0) return false;

    const amounts = holders.map((h) => parseFloat(h.ui_amount));
    const totalTop10 = amounts.reduce((sum, a) => sum + a, 0);
    const top3 = amounts.slice(0, 3).reduce((sum, a) => sum + a, 0);

    const concentration = top3 / totalTop10;
    if (concentration > 0.6) {
      console.log(
        `[signal] Token ${tokenAddress} failed concentration check: ${(concentration * 100).toFixed(1)}%`,
      );
      return false;
    }

    return true;
  } catch (err) {
    console.error(
      `[signal] Holder check failed for ${tokenAddress}:`,
      err.response?.data ?? err.message,
    );
    return false;
  }
}

// Generates a 2-sentence AI explanation via Gemini 2.0 Flash
export async function generateExplanation(signal) {
  try {
    const prompt = `A top-performing Solana wallet just bought $${Math.round(signal.volumeUsd).toLocaleString()} worth of ${signal.tokenSymbol} on ${signal.source}.
This wallet has been among the highest PnL traders on Solana this week.
Write exactly 2 sentences explaining why this trade might be significant and what a crypto trader should watch for. Be specific, concise, and avoid hype.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text;
  } catch (err) {
    console.error("[signal] Gemini explanation failed:", err.message);
    return `A high-performing wallet bought $${Math.round(signal.volumeUsd).toLocaleString()} of ${signal.tokenSymbol}. Monitor price action and volume closely.`;
  }
}

// Master function — score + explain, returns null if token is unsafe
export async function processSignal(signal) {
  const isSafe = await scoreToken(signal.tokenAddress);
  if (!isSafe) return null;

  const explanation = await generateExplanation(signal);
  return { ...signal, explanation };
}
