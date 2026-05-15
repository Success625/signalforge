"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import { BarChart3, Filter, Flame, RefreshCw, Users } from "./icons";
import { SignalCard } from "./signal-card";
import { WalletCard } from "./wallet-card";
import type { SignalCardItem, WalletItem } from "./types";

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

function parseNumeric(value: number | string | null | undefined) {
  const parsed = typeof value === "string" ? Number.parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
}

function formatRelativeTime(unixSeconds: number | null | undefined) {
  if (!unixSeconds) {
    return "Just now";
  }

  const deltaSeconds = Math.max(0, Math.floor(Date.now() / 1000 - unixSeconds));

  if (deltaSeconds < 60) {
    return `${deltaSeconds}s ago`;
  }

  const minutes = Math.floor(deltaSeconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getImpactLabel(volumeUsd: number) {
  if (volumeUsd >= 100000) {
    return "Impact: High";
  }

  if (volumeUsd >= 10000) {
    return "Impact: Medium";
  }

  return "Impact: Low";
}

function getSmartMoneyMeta(style: string | null) {
  switch (style) {
    case "risk_averse":
      return {
        isSafe: true,
        isCaution: false,
        isBlocked: false,
        severityLabel: "Impact: Conservative",
      };
    case "risk_balancers":
      return {
        isSafe: false,
        isCaution: true,
        isBlocked: false,
        severityLabel: "Status: Watching",
      };
    case "trenchers":
      return {
        isSafe: false,
        isCaution: true,
        isBlocked: false,
        severityLabel: "Threat: Elevated",
      };
    default:
      return {
        isSafe: false,
        isCaution: true,
        isBlocked: false,
        severityLabel: "Status: Monitoring",
      };
  }
}

function formatPnlUsd(pnl: number | null | undefined) {
  // Birdeye PnL is treated as absolute USD for the selected period.
  if (typeof pnl !== "number" || Number.isNaN(pnl)) {
    return "--";
  }

  if (pnl === 0) {
    return "$0";
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
  const formatted = formatter.format(Math.abs(pnl));
  return pnl < 0 ? `-${formatted}` : `+${formatted}`;
}

function formatAddressShort(address: string, visibleStart = 6, visibleEnd = 4) {
  if (address.length <= visibleStart + visibleEnd + 3) {
    return address;
  }

  return `${address.slice(0, visibleStart)}...${address.slice(-visibleEnd)}`;
}

function getPnlClassName(pnl: number) {
  if (pnl < 0) {
    return "text-error";
  }

  if (pnl > 0) {
    return "text-primary-container";
  }

  return "text-on-surface";
}


type TrackedWalletsPanelProps = {
  activeWalletAddress: string;
  wallets: WalletItem[];
  isLoading: boolean;
  errorMessage: string | null;
  onSelectWallet: (address: string) => void;
  onRetry?: () => void;
};

function TrackedWalletsPanel({
  activeWalletAddress,
  wallets,
  isLoading,
  errorMessage,
  onSelectWallet,
  onRetry,
}: TrackedWalletsPanelProps) {
  return (
    <section className="w-full lg:w-[30%] border-b lg:border-b-0 lg:border-r border-outline-variant flex flex-col bg-surface-container-low/30 min-h-100 lg:min-h-0 overflow-hidden">
      <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
        <h2 className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
          Tracked Wallets
        </h2>
        <Filter
          className="text-on-surface-variant"
          size={16}
          strokeWidth={1.75}
        />
      </div>
      <div className="flex-1 overflow-y-auto max-h-[60vh] lg:max-h-none p-4 space-y-3">
        {isLoading ? (
          <div className="text-xs text-on-surface-variant">
            Loading tracked wallets...
          </div>
        ) : errorMessage ? (
          <div className="space-y-2">
            <div className="text-xs text-error">{errorMessage}</div>
            {onRetry ? (
              <button
                className="text-xs uppercase tracking-widest text-primary-container"
                onClick={onRetry}
                type="button"
              >
                Retry fetch
              </button>
            ) : null}
          </div>
        ) : wallets.length === 0 ? (
          <div className="text-xs text-on-surface-variant">
            No tracked wallets available yet.
          </div>
        ) : (
          wallets.map((wallet) => (
            <WalletCard
              key={wallet.address}
              {...wallet}
              isActive={wallet.address === activeWalletAddress}
              onSelect={onSelectWallet}
            />
          ))
        )}
      </div>
    </section>
  );
}

type LiveSignalFeedPanelProps = {
  signals: SignalCardItem[];
  isLoading: boolean;
  errorMessage: string | null;
  onRefresh: () => void;
};

function LiveSignalFeedPanel({
  signals,
  isLoading,
  errorMessage,
  onRefresh,
}: LiveSignalFeedPanelProps) {
  const statusLabel = isLoading
    ? "LOADING..."
    : errorMessage
      ? "ERROR"
      : "READY";

  return (
    <section className="w-full lg:w-[45%] flex flex-col bg-background min-h-100 lg:min-h-0 overflow-hidden">
      <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
        <h2 className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
          Live Signal Feed
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-data-sm text-primary-container">
            {statusLabel}
          </span>
          <button
            aria-label="Refresh signal feed"
            className="text-on-surface-variant hover:text-primary-container transition-colors"
            onClick={onRefresh}
            type="button"
          >
            <RefreshCw size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[60vh] lg:max-h-none p-4 space-y-4">
        {isLoading ? (
          <div className="text-xs text-on-surface-variant">
            Loading live signals...
          </div>
        ) : errorMessage ? (
          <div className="space-y-2">
            <div className="text-xs text-error">{errorMessage}</div>
            <button
              className="text-xs uppercase tracking-widest text-primary-container"
              onClick={onRefresh}
              type="button"
            >
              Retry fetch
            </button>
          </div>
        ) : signals.length === 0 ? (
          <div className="text-xs text-on-surface-variant">
            No signals available yet.
          </div>
        ) : (
          signals.map((signal, index) => (
            <SignalCard
              key={`${signal.tokenSymbol}-${signal.timestampLabel}-${signal.wallet || index}`}
              wallet={signal.wallet}
              tokenSymbol={signal.tokenSymbol}
              tokenAddress={signal.tokenAddress}
              volumeUsd={signal.volumeUsd}
              explanation={signal.explanation}
              source={signal.source}
              timestamp={signal.timestampLabel}
              isSafe={signal.isSafe}
              tokenName={signal.tokenName}
              actionLabel={signal.actionLabel}
              severityLabel={signal.severityLabel}
              isBlocked={signal.isBlocked}
              isCaution={signal.isCaution}
            />
          ))
        )}
      </div>
    </section>
  );
}

type TopPerformer = {
  address: string;
  pnl: number;
};

type IntelligenceSummaryPanelProps = {
  topPerformers: TopPerformer[];
  isLoading: boolean;
};

function IntelligenceSummaryPanel({
  topPerformers,
  isLoading,
}: IntelligenceSummaryPanelProps) {
  return (
    <section className="w-full lg:w-[25%] border-t lg:border-t-0 lg:border-l border-outline-variant flex flex-col bg-surface-container-lowest min-h-100 lg:min-h-0 overflow-hidden">
      <div className="p-4 border-b border-outline-variant bg-surface-container-low">
        <h2 className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
          Intelligence Summary
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[60vh] lg:max-h-none p-4 space-y-6">
        <div className="bg-surface-container-low border border-outline-variant p-4 rounded-lg w-full max-w-180 mx-auto">
          <div className="font-label-md text-[10px] text-on-surface-variant mb-4 uppercase">
            Global Signal Composition
          </div>
          <div className="relative w-32 h-32 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                className="stroke-primary-container"
                cx="18"
                cy="18"
                fill="none"
                r="16"
                strokeDasharray="65, 100"
                strokeWidth="4"
              />
              <circle
                className="stroke-secondary-container"
                cx="18"
                cy="18"
                fill="none"
                r="16"
                strokeDasharray="25, 100"
                strokeDashoffset="-65"
                strokeWidth="4"
              />
              <circle
                className="stroke-error"
                cx="18"
                cy="18"
                fill="none"
                r="16"
                strokeDasharray="10, 100"
                strokeDashoffset="-90"
                strokeWidth="4"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-data-md text-lg">1.2K</span>
              <span className="text-[8px] text-on-surface-variant uppercase">
                Signals
              </span>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-data-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-container" />
                Safe
              </span>
              <span className="text-primary-container">65%</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-data-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary-container" />
                Caution
              </span>
              <span className="text-on-surface">25%</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-data-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-error" />
                Unsafe
              </span>
              <span className="text-error">10%</span>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-highest border border-primary-container/30 p-4 rounded-lg w-full max-w-180 mx-auto">
          <div className="flex justify-between items-center mb-3">
            <span className="font-label-md text-[10px] text-primary-container uppercase">
              Hottest Token
            </span>
            <Flame
              className="text-primary-container"
              size={16}
              strokeWidth={1.75}
            />
          </div>
          <div className="flex items-end gap-2 mb-1">
            <span className="font-display-lg text-xl">BONK2.0</span>
            <span className="font-data-sm text-primary-container pb-1">
              +18%
            </span>
          </div>
          <div className="font-data-sm text-on-surface-variant text-[11px] mb-3">
            $0.000012
          </div>
          <div className="p-2 bg-background/50 rounded flex items-center gap-2 border border-outline-variant">
            <Users
              className="text-on-surface-variant"
              size={12}
              strokeWidth={1.75}
            />
            <span className="font-data-sm text-[10px] text-on-surface-variant uppercase">
              Touched by 8 tracked wallets
            </span>
          </div>
        </div>
        <div className="w-full max-w-180 mx-auto">
          <div className="font-label-md text-[10px] text-on-surface-variant mb-3 uppercase flex items-center gap-2">
            <BarChart3
              className="text-on-surface-variant"
              size={16}
              strokeWidth={1.75}
            />
            Top Performers (24h)
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-xs text-on-surface-variant">
                Loading performers...
              </div>
            ) : topPerformers.length === 0 ? (
              <div className="text-xs text-on-surface-variant">
                No wallet performance yet.
              </div>
            ) : (
              topPerformers.map((wallet, index) => (
                <div
                  key={wallet.address}
                  className="flex items-center justify-between p-3 bg-surface-container rounded border border-outline-variant hover:border-primary-container/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                    </span>
                    <span className="font-data-sm text-on-surface">
                      {formatAddressShort(wallet.address)}
                    </span>
                  </div>
                  <span
                    className={`font-data-sm ${getPnlClassName(wallet.pnl)}`}
                  >
                    {formatPnlUsd(wallet.pnl)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-surface-container p-4 rounded-lg border border-outline-variant w-full max-w-180 mx-auto">
          <div className="font-label-md text-[10px] text-on-surface-variant uppercase mb-2">
            Network Load
          </div>
          <div className="w-full bg-background h-1 rounded overflow-hidden">
            <div className="bg-primary-container w-[42%] h-full" />
          </div>
          <div className="mt-2 flex justify-between text-[8px] font-data-sm text-on-surface-variant">
            <span>LATENCY: 14MS</span>
            <span>NODES: 3/4</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SignalFeedDashboard() {
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
        if (
          current &&
          nextWallets.some((wallet) => wallet.address === current)
        ) {
          return current;
        }
        return nextWallets[0]?.address ?? "";
      });
    } catch (err) {
      setWalletsError(
        err instanceof Error ? err.message : "Failed to load wallets",
      );
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
        const smartMoneyMeta = smartMoneyStyle
          ? getSmartMoneyMeta(smartMoneyStyle)
          : null;
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
          severityLabel: sourceRaw === "ai_insight" ? "Impact: High" : (smartMoneyMeta
            ? smartMoneyMeta.severityLabel
            : getImpactLabel(volumeUsd)),
          isSafe: sourceRaw === "ai_insight" ? true : (smartMoneyMeta ? smartMoneyMeta.isSafe : true),
          isBlocked: sourceRaw === "ai_insight" ? false : (smartMoneyMeta ? smartMoneyMeta.isBlocked : false),
          isCaution: sourceRaw === "ai_insight" ? false : (smartMoneyMeta ? smartMoneyMeta.isCaution : false),
        } as SignalCardItem;
      });

      setSignals(nextSignals);
    } catch (err) {
      setSignalsError(
        err instanceof Error ? err.message : "Failed to load signals",
      );
      setSignals([]);
    } finally {
      setIsSignalsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchWallets();
    }, 0);

    return () => clearTimeout(timeout);
  }, [fetchWallets]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void fetchSignals();
    }, 0);

    return () => clearTimeout(timeout);
  }, [fetchSignals]);

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-full w-full">
      <TrackedWalletsPanel
        activeWalletAddress={activeWalletAddress}
        wallets={wallets}
        isLoading={isWalletsLoading}
        errorMessage={walletsError}
        onSelectWallet={setActiveWalletAddress}
        onRetry={fetchWallets}
      />
      <LiveSignalFeedPanel
        signals={signals}
        isLoading={isSignalsLoading}
        errorMessage={signalsError}
        onRefresh={fetchSignals}
      />
      <IntelligenceSummaryPanel
        topPerformers={topPerformers}
        isLoading={isWalletsLoading}
      />
    </div>
  );
}
