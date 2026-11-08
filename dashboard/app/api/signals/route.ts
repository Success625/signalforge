import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

const BIRDEYE_BASE_URL = "https://public-api.birdeye.so";
const UPSTREAM_TIMEOUT_MS = 4000;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function jsonResponse(payload: unknown) {
  return NextResponse.json(payload, {
    status: 200,
    headers: NO_STORE_HEADERS,
  });
}

function getBirdeyeHeaders() {
  const apiKey = process.env.BIRDEYE_API_KEY;

  if (!apiKey) {
    return null;
  }

  return {
    "X-API-KEY": apiKey,
    "x-chain": "solana",
    accept: "application/json",
  };
}

function formatUsd(value: number) {
  if (!Number.isFinite(value)) {
    return "$0";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(value));
}

async function fetchSmartMoneyFallback() {
  const headers = getBirdeyeHeaders();

  if (!headers) {
    return [];
  }

  const url = new URL(`${BIRDEYE_BASE_URL}/smart-money/v1/token/list`);
  url.searchParams.set("interval", "1d");
  url.searchParams.set("trader_style", "all");
  url.searchParams.set("sort_by", "net_flow");
  url.searchParams.set("sort_type", "desc");
  url.searchParams.set("limit", "10");

  try {
    const response = await fetch(url.toString(), {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    const items = payload?.data ?? [];
    const nowUnix = Math.floor(Date.now() / 1000);

    return items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item: any) => item?.token && item?.symbol)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => {
        const netFlow = Number(item?.net_flow ?? 0);
        const volumeUsd = Number(item?.volume_usd ?? 0);
        const measuredVolume = Number.isFinite(volumeUsd)
          ? volumeUsd
          : Number.isFinite(netFlow)
            ? netFlow
            : 0;
        const traderCount = Number(item?.smart_traders_no ?? 0);
        const tokenLabel = item?.name
          ? `${item.name} (${item.symbol})`
          : item.symbol;

        return {
          wallet: "smart-money",
          token_symbol: item.symbol,
          token_address: item.token,
          volume_usd: Math.abs(measuredVolume),
          tx_hash: null,
          source: `smart_money:${item?.trader_style ?? "all"}`,
          timestamp: nowUnix,
          explanation: `Smart money is rotating into ${tokenLabel}. Net flow ${formatUsd(netFlow)} with ${traderCount} traders over 1d.`,
          created_at: new Date().toISOString(),
        };
      });
  } catch (err) {
    console.error("fetchSmartMoneyFallback error:", err);
    return [];
  }
}

async function fetchWalletsFallback() {
  try {
    const apiBaseUrl =
      process.env.API_BASE_URL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      "http://localhost:3001";
    const response = await fetch(
      `${apiBaseUrl.replace(/\/+$/, "")}/api/wallet-insights`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      },
    );
    if (!response.ok) return [];

    const insights = await response.json();
    return Array.isArray(insights) ? insights : [];
  } catch (err) {
    console.error("fetchWalletsFallback error:", err);
    return [];
  }
}

export const dynamic = "force-dynamic";

export async function GET() {
  const client = getSupabaseClient();

  if (client) {
    try {
      const { data, error } = await client
        .from("signals")
        .select(
          "wallet,token_symbol,token_address,volume_usd,tx_hash,source,timestamp,explanation,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(20)
        .abortSignal(AbortSignal.timeout(UPSTREAM_TIMEOUT_MS));

      if (!error && data && data.length > 0) {
        return jsonResponse(data);
      }
    } catch {
      // Fall through to the optional live-data fallbacks.
    }
  }

  const fallback = await fetchSmartMoneyFallback();
  if (fallback.length > 0) {
    return jsonResponse(fallback);
  }

  const walletInsights = await fetchWalletsFallback();
  return jsonResponse(walletInsights);
}
