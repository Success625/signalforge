import type { NavItem, SignalCardItem, SummaryMetric } from "./types";

export const headerMetrics: SummaryMetric[] = [
  { label: "SIGNALS TODAY", value: "1,284" },
  { label: "WALLETS TRACKED", value: "42" },
  { label: "UNSAFE BLOCKED", value: "89", valueClassName: "text-error" },
  { label: "UPTIME", value: "99.9%", valueClassName: "text-primary-container" },
];

export const primaryNavItems: NavItem[] = [
  { label: "Live Feed", href: "#", icon: "feed", active: true },
  { label: "Wallets", href: "#", icon: "wallet" },
  { label: "Alpha AI", href: "#", icon: "brain" },
  { label: "Alerts", href: "#", icon: "alerts" },
  { label: "History", href: "#", icon: "history" },
];

export const utilityNavItems: NavItem[] = [
  { label: "Support", href: "#", icon: "support" },
  { label: "Logs", href: "#", icon: "logs" },
];

export const signalFeedItems: SignalCardItem[] = [
  {
    tokenName: "SOLCUE",
    tokenSymbol: "SCUE",
    volumeUsd: 45200,
    actionLabel: "Buy Signal",
    explanation:
      '"Unusual accumulation from high-conviction wallet 0x3b...88. Transaction velocity suggests institutional-grade alpha. Liquidity depth is sufficient for scale entry."',
    source: "ai",
    timestampLabel: "1m ago",
    wallet: "0x3b...88",
    severityLabel: "Impact: High",
    isSafe: true,
  },
  {
    tokenName: "MOONCAT",
    tokenSymbol: "MCAT",
    volumeUsd: 1200,
    actionLabel: "Buy Signal",
    explanation:
      '"Warning: Developer liquidity removed 10s after buy. Potential rug-pull signature detected. High-frequency sell-off initiated by internal dev wallets."',
    source: "system",
    timestampLabel: "4m ago",
    wallet: "0x92...a1",
    severityLabel: "Threat: Critical",
    isSafe: false,
    isBlocked: true,
  },
  {
    tokenName: "PUMPIT",
    tokenSymbol: "PMP",
    volumeUsd: 8900,
    actionLabel: "Swapping",
    explanation:
      '"Retail FOMO increasing. No institutional wallets detected yet. High volatility expected around current resistance level."',
    source: "monitoring",
    timestampLabel: "8m ago",
    wallet: "0x55...d2",
    severityLabel: "Status: Watching",
    isSafe: false,
    isCaution: true,
  },
];
