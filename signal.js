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
    const prompt = `You are a high-conviction Solana market analyst.
A top-performing wallet just bought $${Math.round(signal.volumeUsd).toLocaleString()} worth of ${signal.tokenSymbol} on ${signal.source}.
This wallet has ranked among the highest PnL traders on Solana this week.
Write exactly 2 sentences.
Sentence 1 must start with "The smart money is rotating to" and include the token symbol.
Sentence 2 must include "Conviction Level: X/10" where X is a number from 1 to 10 and end with a period.
Keep it concise, narrative, and hype-forward without emojis or hashtags.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    return text;
  } catch (err) {
    console.error("[signal] Gemini explanation failed:", err.message);
    return `The smart money is rotating to ${signal.tokenSymbol} after a $${Math.round(signal.volumeUsd).toLocaleString()} buy on ${signal.source}. Conviction Level: 7/10.`;
  }
}

// Master function — score + explain, returns null if token is unsafe
export async function processSignal(signal) {
  const isSafe = await scoreToken(signal.tokenAddress);
  if (!isSafe) return null;

  const explanation = await generateExplanation(signal);
  return { ...signal, explanation };
}
