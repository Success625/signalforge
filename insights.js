import { GoogleGenerativeAI } from "@google/generative-ai";

let cachedInsights = [];

export async function generateWalletInsights(wallets) {
  if (!wallets || wallets.length === 0) return [];
  
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      console.warn("[insights] GOOGLE_API_KEY missing, skipping AI generation.");
      return [];
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json"
      }
    });
    
    const topWallets = wallets.slice(0, 5);
    
    const prompt = `You are a hype/degen crypto AI analyst for SignalForge. 
I have a list of highly profitable wallets. Write a 1-2 sentence hype/degen style insight for each wallet highlighting their most impressive stat (PnL, win rate, or trade count). Make it engaging, smart, and clear.
Return the output strictly as a JSON array of strings in the exact same order.
Here are the wallets:
${JSON.stringify(topWallets, null, 2)}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const narrations = JSON.parse(text);
    
    const nowUnix = Math.floor(Date.now() / 1000);
    
    const insights = topWallets.map((wallet, index) => {
      const pnl = Number(wallet.pnl ?? 0);
      return {
        wallet: wallet.address,
        token_symbol: "ALPHA",
        token_address: null,
        volume_usd: Math.abs(pnl),
        tx_hash: null,
        source: "ai_insight",
        timestamp: nowUnix,
        explanation: narrations[index] || `This wallet is crushing it with massive PnL. SignalForge AI is tracking its moves.`,
        created_at: new Date().toISOString(),
      };
    });
    
    cachedInsights = insights;
    console.log(`[insights] Generated ${insights.length} AI insights`);
    return insights;
  } catch (err) {
    console.error("[insights] Failed to generate AI insights:", err.message);
    return cachedInsights;
  }
}

export function getCachedInsights() {
  return cachedInsights;
}
