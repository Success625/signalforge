import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const BIRDEYE_BASE_URL = "https://public-api.birdeye.so";

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

  const response = await fetch(url.toString(), { headers, cache: "no-store" });

  if (!response.ok) {
    return [];
  }

  const payload = await response.json();
  const items = payload?.data ?? [];
  const nowUnix = Math.floor(Date.now() / 1000);

  return items
    .filter((item: any) => item?.token && item?.symbol)
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
}

function getSupabaseClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseKey);
}

export async function GET() {
  const client = getSupabaseClient();

  if (!client) {
    return NextResponse.json(
      { error: "Missing Supabase configuration" },
      { status: 500 },
    );
  }

  const { data, error } = await client
    .from("signals")
    .select(
      "wallet,token_symbol,token_address,volume_usd,tx_hash,source,timestamp,explanation,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    const fallback = await fetchSmartMoneyFallback();
    return NextResponse.json(fallback);
  }

  return NextResponse.json(data);
}
