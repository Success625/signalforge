"use client";

import { BarChart3, Filter, Flame, RefreshCw, Users } from "./icons";
import { SignalCard } from "./signal-card";
import { WalletCard } from "./wallet-card";
import type { SignalCardItem, WalletItem } from "./types";
import { useDashboard, TopPerformer, formatPnlUsd } from "../DashboardContext";

function formatAddressShort(address: string, visibleStart = 6, visibleEnd = 4) {
  if (address.length <= visibleStart + visibleEnd + 3) {
    return address;
  }
  return `${address.slice(0, visibleStart)}...${address.slice(-visibleEnd)}`;
}

function getPnlClassName(pnl: number) {
  if (pnl < 0) return "text-error";
  if (pnl > 0) return "text-primary-container";
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
        <Filter className="text-on-surface-variant" size={16} strokeWidth={1.75} />
      </div>
      <div className="flex-1 overflow-y-auto max-h-[60vh] lg:max-h-none p-4 space-y-3">
        {isLoading ? (
          <div className="text-xs text-on-surface-variant">Loading tracked wallets...</div>
        ) : errorMessage ? (
          <div className="space-y-2">
            <div className="text-xs text-error">{errorMessage}</div>
            {onRetry && (
              <button
                className="text-xs uppercase tracking-widest text-primary-container"
                onClick={onRetry}
                type="button"
              >
                Retry fetch
              </button>
            )}
          </div>
        ) : wallets.length === 0 ? (
          <div className="text-xs text-on-surface-variant">No tracked wallets available yet.</div>
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
  const statusLabel = isLoading ? "LOADING..." : errorMessage ? "ERROR" : "READY";

  return (
    <section className="w-full lg:w-[45%] flex flex-col bg-background min-h-100 lg:min-h-0 overflow-hidden">
      <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
        <h2 className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
          Live Signal Feed
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-data-sm text-primary-container">{statusLabel}</span>
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
          <div className="text-xs text-on-surface-variant">Loading live signals...</div>
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
          <div className="text-xs text-on-surface-variant">No signals available yet.</div>
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

type IntelligenceSummaryPanelProps = {
  topPerformers: TopPerformer[];
  isLoading: boolean;
  signals: SignalCardItem[];
};

function IntelligenceSummaryPanel({
  topPerformers,
  isLoading,
  signals,
}: IntelligenceSummaryPanelProps) {
  const totalSignals = Math.max(1, signals.length);
  const safeCount = signals.filter(s => s.isSafe && !s.isCaution && !s.isBlocked).length;
  const cautionCount = signals.filter(s => s.isCaution && !s.isBlocked).length;
  const unsafeCount = signals.filter(s => s.isBlocked || (!s.isSafe && !s.isCaution)).length;

  const safePct = Math.round((safeCount / totalSignals) * 100);
  const cautionPct = Math.round((cautionCount / totalSignals) * 100);
  const unsafePct = Math.round((unsafeCount / totalSignals) * 100);

  // Dash array parameters (Circumference ~ 100 for r=16)
  const safeDash = Math.max(0, safePct - 2); 
  const cautionDash = Math.max(0, cautionPct - 2);
  const unsafeDash = Math.max(0, unsafePct - 2);

  const safeOffset = 0;
  const cautionOffset = -safePct;
  const unsafeOffset = -(safePct + cautionPct);

  // Compute hottest token
  const tokenStats = signals.reduce((acc, sig) => {
    if (!sig.tokenSymbol || sig.tokenSymbol === 'UNK') return acc;
    if (!acc[sig.tokenSymbol]) {
      acc[sig.tokenSymbol] = { volume: 0, wallets: new Set<string>() };
    }
    acc[sig.tokenSymbol].volume += sig.volumeUsd || 0;
    if (sig.wallet) acc[sig.tokenSymbol].wallets.add(sig.wallet);
    return acc;
  }, {} as Record<string, { volume: number, wallets: Set<string> }>);

  let hottestTokenSymbol = "N/A";
  let hottestVolume = 0;
  let hottestWalletsCount = 0;

  Object.entries(tokenStats).forEach(([symbol, stats]) => {
    if (stats.volume > hottestVolume) {
      hottestVolume = stats.volume;
      hottestTokenSymbol = symbol;
      hottestWalletsCount = stats.wallets.size;
    }
  });

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
                strokeDasharray={`${safeDash}, 100`}
                strokeDashoffset={safeOffset}
                strokeWidth="4"
              />
              <circle
                className="stroke-secondary-container"
                cx="18"
                cy="18"
                fill="none"
                r="16"
                strokeDasharray={`${cautionDash}, 100`}
                strokeDashoffset={cautionOffset}
                strokeWidth="4"
              />
              <circle
                className="stroke-error"
                cx="18"
                cy="18"
                fill="none"
                r="16"
                strokeDasharray={`${unsafeDash}, 100`}
                strokeDashoffset={unsafeOffset}
                strokeWidth="4"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-data-md text-lg">{signals.length}</span>
              <span className="text-[8px] text-on-surface-variant uppercase">Signals</span>
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-data-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-container" />
                Safe
              </span>
              <span className="text-primary-container">{signals.length ? safePct : 0}%</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-data-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary-container" />
                Caution
              </span>
              <span className="text-on-surface">{signals.length ? cautionPct : 0}%</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-data-sm">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-error" />
                Unsafe
              </span>
              <span className="text-error">{signals.length ? unsafePct : 0}%</span>
            </div>
          </div>
        </div>
        <div className="bg-surface-container-highest border border-primary-container/30 p-4 rounded-lg w-full max-w-180 mx-auto">
          <div className="flex justify-between items-center mb-3">
            <span className="font-label-md text-[10px] text-primary-container uppercase">
              Hottest Token
            </span>
            <Flame className="text-primary-container" size={16} strokeWidth={1.75} />
          </div>
          <div className="flex items-end gap-2 mb-1">
            <span className="font-display-lg text-xl">{hottestTokenSymbol}</span>
            <span className="font-data-sm text-primary-container pb-1">+ Live</span>
          </div>
          <div className="font-data-sm text-on-surface-variant text-[11px] mb-3">
            Vol: ${Math.round(hottestVolume).toLocaleString()}
          </div>
          <div className="p-2 bg-background/50 rounded flex items-center gap-2 border border-outline-variant">
            <Users className="text-on-surface-variant" size={12} strokeWidth={1.75} />
            <span className="font-data-sm text-[10px] text-on-surface-variant uppercase">
              Touched by {hottestWalletsCount} tracked wallets
            </span>
          </div>
        </div>
        <div className="w-full max-w-180 mx-auto">
          <div className="font-label-md text-[10px] text-on-surface-variant mb-3 uppercase flex items-center gap-2">
            <BarChart3 className="text-on-surface-variant" size={16} strokeWidth={1.75} />
            Top Performers (24h)
          </div>
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-xs text-on-surface-variant">Loading performers...</div>
            ) : topPerformers.length === 0 ? (
              <div className="text-xs text-on-surface-variant">No wallet performance yet.</div>
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
                  <span className={`font-data-sm ${getPnlClassName(wallet.pnl)}`}>
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
  const {
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
  } = useDashboard();

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
        signals={signals}
      />
    </div>
  );
}
