export type WalletItem = {
  address: string;
  pnl24h: string;
  winRate: string;
  isActive?: boolean;
  isDimmed?: boolean;
  isPremium?: boolean;
  chartHeights?: string[];
};

export type SignalCardItem = {
  tokenName: string;
  tokenSymbol: string;
  volumeUsd: number;
  actionLabel: string;
  explanation: string;
  source: "ai" | "system" | "monitoring";
  timestampLabel: string;
  wallet: string;
  severityLabel: string;
  isSafe: boolean;
  isBlocked?: boolean;
  isCaution?: boolean;
};

export type SummaryMetric = {
  label: string;
  value: string;
  valueClassName?: string;
};

export type NavItem = {
  label: string;
  href: string;
  icon: "feed" | "wallet" | "brain" | "alerts" | "history" | "support" | "logs";
  active?: boolean;
};
