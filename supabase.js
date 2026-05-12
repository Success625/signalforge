import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

let warned = false;

function getClient() {
  if (!supabase) {
    if (!warned) {
      console.warn(
        "[supabase] Missing SUPABASE_URL or SUPABASE_ANON_KEY; persistence disabled",
      );
      warned = true;
    }
    return null;
  }

  return supabase;
}

export async function loadTrackedWalletsFromDb() {
  const client = getClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from("wallets")
      .select("address,pnl,trade_count,win_rate");

    if (error) throw error;

    return (data ?? []).map((row) => ({
      address: row.address,
      pnl: row.pnl,
      tradeCount: row.trade_count,
      winRate: row.win_rate,
    }));
  } catch (err) {
    console.warn("[supabase] Failed to load wallets:", err.message ?? err);
    return [];
  }
}

export async function upsertTrackedWallets(wallets) {
  const client = getClient();
  if (!client || wallets.length === 0) return;

  const payload = wallets.map((wallet) => ({
    address: wallet.address,
    pnl: wallet.pnl ?? null,
    trade_count: wallet.tradeCount ?? null,
    win_rate: wallet.winRate ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await client.from("wallets").upsert(payload, {
    onConflict: "address",
  });

  if (error) {
    console.warn(
      "[supabase] Failed to upsert wallets:",
      error.message ?? error,
    );
  }
}

export async function loadLastSeenMarkers() {
  const client = getClient();
  if (!client) return {};

  try {
    const { data, error } = await client
      .from("last_seen")
      .select("wallet_address,tx_hash,block_unix_time");

    if (error) throw error;

    const markers = {};

    for (const row of data ?? []) {
      markers[row.wallet_address] = {
        txHash: row.tx_hash,
        blockUnixTime: row.block_unix_time,
      };
    }

    return markers;
  } catch (err) {
    console.warn(
      "[supabase] Failed to load last-seen markers:",
      err.message ?? err,
    );
    return {};
  }
}

export async function upsertLastSeenMarkers(markers) {
  const client = getClient();
  if (!client || markers.length === 0) return;

  const payload = markers.map((marker) => ({
    wallet_address: marker.walletAddress,
    tx_hash: marker.txHash ?? null,
    block_unix_time: marker.blockUnixTime ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await client.from("last_seen").upsert(payload, {
    onConflict: "wallet_address",
  });

  if (error) {
    console.warn(
      "[supabase] Failed to upsert last-seen markers:",
      error.message ?? error,
    );
  }
}

export async function insertSignals(signals) {
  const client = getClient();
  if (!client || signals.length === 0) return;

  const payload = signals.map((signal) => ({
    wallet: signal.wallet,
    token_symbol: signal.tokenSymbol,
    token_address: signal.tokenAddress,
    volume_usd: signal.volumeUsd,
    tx_hash: signal.txHash,
    source: signal.source,
    timestamp: signal.timestamp,
    explanation: signal.explanation,
    created_at: new Date().toISOString(),
  }));

  const { error } = await client.from("signals").insert(payload);

  if (error) {
    console.warn(
      "[supabase] Failed to insert signals:",
      error.message ?? error,
    );
  }
}
