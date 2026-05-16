"use client";

import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { z } from "zod";
import type { SignalCardItem, WalletItem } from "./signal-feed/types";

const walletResponseSchema = z.array(
  z.object({
    address: z.string(),
    pnl: z.union([z.number(), z.string()]).nullable().optional(),
    tradeCount: z.union([z.number(), z.string()]).nullable().optional(),
  }),
);

const signalResponseSchema = z.array(
  z.object({
    wallet: z.string().nullable().optional(),
    token_symbol: z.string().nullable().optional(),
    token_address: z.string().nullable().optional(),
    volume_usd: z.union([z.number(), z.string()]).nullable().optional(),
    tx_hash: z.string().nullable().optional(),
    source: z.string().nullable().optional(),
    timestamp: z.union([z.number(), z.string()]).nullable().optional(),
    explanation: z.string().nullable().optional(),
    created_at: z.string().nullable().optional(),
  }),
);

export type TopPerformer = {
  address: string;
  pnl: number;
};

type DashboardContextType = {
  wallets: WalletItem[];
  activeWalletAddress: string;
  walletsError: string | null;
  isWalletsLoading: boolean;
  topPerformers: TopPerformer[];
  signals: SignalCardItem[];
  signalsError: string | null;
  isSignalsLoading: boolean;
  setActiveWalletAddress: (addr: string) => void;
  fetchWallets: () => void;
  fetchSignals: () => void;
};

const DashboardContext = createContext<DashboardContextType | null>(null);

function parseNumeric(value: number | string | null | undefined) {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
}

function formatRelativeTime(unixSeconds: number | null | undefined) {
  if (!unixSeconds) return "Just now";
  const deltaSeconds = Math.max(0, Math.floor(Date.now() / 1000 - unixSeconds));
  if (deltaSeconds < 60) return `${deltaSeconds}s ago`;
  const minutes = Math.floor(deltaSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getImpactLabel(volumeUsd: number) {
  if (volumeUsd >= 100000) return "Impact: High";
  if (volumeUsd >= 10000) return "Impact: Medium";
  return "Impact: Low";
}

function getSmartMoneyMeta(style: string | null) {
  switch (style) {
    case "risk_averse":
      return { isSafe: true, isCaution: false, isBlocked: false, severityLabel: "Impact: Conservative" };
    case "risk_balancers":
      return { isSafe: false, isCaution: true, isBlocked: false, severityLabel: "Status: Watching" };
    case "trenchers":
      return { isSafe: false, isCaution: true, isBlocked: false, severityLabel: "Threat: Elevated" };
    default:
      return { isSafe: false, isCaution: true, isBlocked: false, severityLabel: "Status: Monitoring" };
  }
}

export function formatPnlUsd(pnl: number | null | undefined) {
  if (typeof pnl !== "number" || Number.isNaN(pnl)) return "--";
  if (pnl === 0) return "$0";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const formatted = formatter.format(Math.abs(pnl));
  return pnl < 0 ? `-${formatted}` : `+${formatted}`;
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [wallets, setWallets] = useState<WalletItem[]>([]);
  const [activeWalletAddress, setActiveWalletAddress] = useState("");
  const [walletsError, setWalletsError] = useState<string | null>(null);
  const [isWalletsLoading, setIsWalletsLoading] = useState(true);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [signals, setSignals] = useState<SignalCardItem[]>([]);
  const [signalsError, setSignalsError] = useState<string | null>(null);
  const [isSignalsLoading, setIsSignalsLoading] = useState(true);

  const fetchWallets = useCallback(async () => {
    setIsWalletsLoading(true);
    setWalletsError(null);

    try {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";
      const response = await fetch(`${apiBaseUrl}/api/tracked-wallets`);

      if (!response.ok) {
        throw new Error(`Wallet fetch failed (${response.status})`);
      }

      const payload = await response.json();
      const parsed = walletResponseSchema.safeParse(payload);

      if (!parsed.success) {
        throw new Error("Wallet response validation failed");
      }

      const nextWallets = parsed.data.map((wallet, index) => ({
        address: wallet.address,
        pnlUsd: formatPnlUsd(parseNumeric(wallet.pnl)),
        tradeCount: parseNumeric(wallet.tradeCount) ?? undefined,
        isPremium: index === 0,
      }));

      const ranked = parsed.data
        .map((wallet) => ({ ...wallet, pnl: parseNumeric(wallet.pnl) }))
        .filter((wallet) => typeof wallet.pnl === "number")
        .sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0))
        .slice(0, 3)
        .map((wallet) => ({
          address: wallet.address,
          pnl: wallet.pnl ?? 0,
        }));

      setWallets(nextWallets);
      setTopPerformers(ranked);
      setActiveWalletAddress((current) => {
        if (current && nextWallets.some((w) => w.address === current)) {
          return current;
        }
        return nextWallets[0]?.address ?? "";
      });
    } catch (err) {
      setWalletsError(err instanceof Error ? err.message : "Failed to load wallets");
      setWallets([]);
      setTopPerformers([]);
    } finally {
      setIsWalletsLoading(false);
    }
  }, []);

  const fetchSignals = useCallback(async () => {
    setIsSignalsLoading(true);
    setSignalsError(null);

    try {
      const response = await fetch("/api/signals", { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`Signal fetch failed (${response.status})`);
      }

      const payload = await response.json();
      const parsed = signalResponseSchema.safeParse(payload);

      if (!parsed.success) {
        throw new Error("Signal response validation failed");
      }

      const nextSignals = parsed.data.map((row) => {
        const volumeUsd = parseNumeric(row.volume_usd) ?? 0;
        const timestamp = parseNumeric(row.timestamp);
        const createdAtSeconds = row.created_at
          ? Math.floor(Date.parse(row.created_at) / 1000)
          : null;
        const timestampSeconds = timestamp ?? createdAtSeconds;
        const sourceRaw = row.source ?? "monitoring";
        const smartMoneyStyle = sourceRaw.startsWith("smart_money")
          ? (sourceRaw.split(":")[1] ?? "all")
          : null;
        const smartMoneyMeta = smartMoneyStyle ? getSmartMoneyMeta(smartMoneyStyle) : null;
        const tokenSymbol = row.token_symbol ?? "UNK";

        return {
          tokenName: tokenSymbol,
          tokenSymbol,
          tokenAddress: row.token_address ?? undefined,
          volumeUsd,
          actionLabel: sourceRaw === "ai_insight" ? "Wallet Insight" : (smartMoneyStyle ? "Smart Money Flow" : "Buy Signal"),
          explanation: row.explanation ?? "Signal detected.",
          source: sourceRaw === "ai_insight" ? "ai_insight" : (smartMoneyStyle ? "smart_money" : "ai"),
          timestampLabel: formatRelativeTime(timestampSeconds ?? undefined),
          wallet: row.wallet ?? (smartMoneyStyle ? "smart-money" : "unknown"),
          severityLabel: sourceRaw === "ai_insight" ? "Impact: High" : (smartMoneyMeta ? smartMoneyMeta.severityLabel : getImpactLabel(volumeUsd)),
          isSafe: sourceRaw === "ai_insight" ? true : (smartMoneyMeta ? smartMoneyMeta.isSafe : true),
          isBlocked: sourceRaw === "ai_insight" ? false : (smartMoneyMeta ? smartMoneyMeta.isBlocked : false),
          isCaution: sourceRaw === "ai_insight" ? false : (smartMoneyMeta ? smartMoneyMeta.isCaution : false),
        } as SignalCardItem;
      });

      setSignals(nextSignals);
    } catch (err) {
      setSignalsError(err instanceof Error ? err.message : "Failed to load signals");
      setSignals([]);
    } finally {
      setIsSignalsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallets();
    fetchSignals();
    
    // Optional polling for a hackathon demo:
    const intervalId = setInterval(() => {
      fetchWallets();
      fetchSignals();
    }, 30000); // 30s updates
    
    return () => clearInterval(intervalId);
  }, [fetchWallets, fetchSignals]);

  return (
    <DashboardContext.Provider
      value={{
        wallets,
        activeWalletAddress,
        walletsError,
        isWalletsLoading,
        topPerformers,
        signals,
        signalsError,
        isSignalsLoading,
        setActiveWalletAddress,
        fetchWallets,
        fetchSignals,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
