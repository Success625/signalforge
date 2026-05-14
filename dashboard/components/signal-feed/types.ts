export type WalletItem = {
  address: string;
  pnlUsd: string;
  tradeCount?: number;
  isActive?: boolean;
  isDimmed?: boolean;
  isPremium?: boolean;
  chartHeights?: string[];
};

export type SignalCardItem = {
  tokenName: string;
  tokenSymbol: string;
  tokenAddress?: string;
  volumeUsd: number;
  actionLabel: string;
  explanation: string;
  source: "ai" | "system" | "monitoring" | "smart_money";
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
