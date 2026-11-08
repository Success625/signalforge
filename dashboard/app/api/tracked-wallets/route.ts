import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

const UPSTREAM_TIMEOUT_MS = 2000;

type TrackedWallet = {
  address: string;
  pnl: number | string | null;
  tradeCount: number | string | null;
};

function normalizeWallets(payload: unknown): TrackedWallet[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.flatMap((row) => {
    if (!row || typeof row !== "object") {
      return [];
    }

    const record = row as Record<string, unknown>;

    if (typeof record.address !== "string" || record.address.length === 0) {
      return [];
    }

    const pnl =
      typeof record.pnl === "number" || typeof record.pnl === "string"
        ? record.pnl
        : null;
    const tradeCount =
      typeof record.tradeCount === "number" ||
      typeof record.tradeCount === "string"
        ? record.tradeCount
        : null;

    return [{ address: record.address, pnl, tradeCount }];
  });
}

async function fetchBackendWallets(): Promise<TrackedWallet[]> {
  const apiBaseUrl =
    process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    return [];
  }

  try {
    const response = await fetch(
      `${apiBaseUrl.replace(/\/+$/, "")}/api/tracked-wallets`,
      {
        cache: "no-store",
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      },
    );

    if (!response.ok) {
      return [];
    }

    return normalizeWallets(await response.json());
  } catch {
    return [];
  }
}

async function fetchSupabaseWallets(): Promise<TrackedWallet[]> {
  const client = getSupabaseClient();

  if (!client) {
    return [];
  }

  try {
    const { data, error } = await client
      .from("wallets")
      .select("address,pnl,trade_count")
      .order("pnl", { ascending: false, nullsFirst: false })
      .limit(100)
      .abortSignal(AbortSignal.timeout(UPSTREAM_TIMEOUT_MS));

    if (error) {
      return [];
    }

    return normalizeWallets(
      (data ?? []).map((row) => ({
        address: row.address,
        pnl: row.pnl,
        tradeCount: row.trade_count,
      })),
    );
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export async function GET() {
  const [backendWallets, supabaseWallets] = await Promise.all([
    fetchBackendWallets(),
    fetchSupabaseWallets(),
  ]);

  const wallets = backendWallets.length > 0 ? backendWallets : supabaseWallets;

  return NextResponse.json(wallets, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
