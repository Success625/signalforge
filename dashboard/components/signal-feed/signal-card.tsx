import { ArrowLeftRight, Brain, Coins, Eye, ShieldAlert } from "./icons";
import type { SignalCardItem } from "./types";

type SignalCardProps = {
  wallet: string;
  tokenSymbol: string;
  volumeUsd: number;
  explanation: string;
  source: "ai" | "system" | "monitoring";
  timestamp: string;
  isSafe: boolean;
  concentrationPct?: number;
  tokenName: string;
  actionLabel: string;
  severityLabel: string;
  isBlocked?: boolean;
  isCaution?: boolean;
};

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getSignalPresentation({
  source,
  isSafe,
  isCaution,
}: Pick<SignalCardItem, "source" | "isSafe" | "isCaution">) {
  if (isSafe) {
    return {
      cardClassName: "bg-surface-container-low border border-outline-variant",
      iconWrapClassName:
        "w-12 h-12 bg-primary-container/10 border border-primary-container rounded flex items-center justify-center",
      icon: Coins,
      iconClassName: "text-primary-container",
      titleClassName: "text-on-surface",
      volumeClassName: "text-primary-container",
      badgeClassName:
        "bg-on-primary-container text-primary-container px-3 py-1 rounded text-[10px] font-black border border-primary-container",
      badgeLabel: "SAFE",
      insightClassName:
        "bg-surface-container border-l-2 border-primary-container p-4 rounded-r-lg",
      insightIcon: Brain,
      insightIconClassName: "text-primary-container text-sm",
      insightLabel: "AI ALPHA INSIGHT",
      insightLabelClassName: "text-[10px] font-label-md text-primary-container uppercase",
      explanationClassName:
        "font-ai-note text-ai-note text-on-surface-variant italic leading-relaxed",
      footerAction: (
        <button className="bg-primary-container text-on-primary font-label-md text-[10px] px-4 py-1.5 rounded uppercase font-bold hover:bg-primary-fixed transition-colors">
          Track Transaction
        </button>
      ),
    };
  }

  if (source === "system") {
    return {
      cardClassName:
        "bg-error-container/10 border border-error/30 glow-border-danger",
      iconWrapClassName:
        "w-12 h-12 bg-error/10 border border-error/50 rounded flex items-center justify-center",
      icon: ShieldAlert,
      iconClassName: "text-error",
      titleClassName: "text-error",
      volumeClassName: "text-error",
      badgeClassName: "bg-error text-on-error px-3 py-1 rounded text-[10px] font-black",
      badgeLabel: "UNSAFE",
      insightClassName: "bg-black/20 border-l-2 border-error p-4 rounded-r-lg",
      insightIcon: ShieldAlert,
      insightIconClassName: "text-error text-sm",
      insightLabel: "SYSTEM ALERT",
      insightLabelClassName: "text-[10px] font-label-md text-error uppercase",
      explanationClassName: "font-ai-note text-ai-note text-error/90 italic leading-relaxed",
      footerAction: <span className="text-[10px] font-label-md text-error uppercase font-bold">AUTO-BLOCKED</span>,
    };
  }

  return {
    cardClassName: "bg-surface-container-low border border-outline-variant opacity-90",
    iconWrapClassName:
      "w-12 h-12 bg-secondary/10 border border-secondary rounded flex items-center justify-center",
    icon: ArrowLeftRight,
    iconClassName: "text-secondary",
    titleClassName: "text-on-surface",
    volumeClassName: "text-on-surface",
    badgeClassName:
      "bg-secondary-container text-on-secondary-container px-3 py-1 rounded text-[10px] font-black",
    badgeLabel: isCaution ? "CAUTION" : "MONITORING",
    insightClassName:
      "bg-surface-container border-l-2 border-secondary-container p-4 rounded-r-lg",
    insightIcon: Eye,
    insightIconClassName: "text-secondary text-sm",
    insightLabel: "MONITORING",
    insightLabelClassName: "text-[10px] font-label-md text-secondary uppercase",
    explanationClassName:
      "font-ai-note text-ai-note text-on-surface-variant italic leading-relaxed",
    footerAction: null,
  };
}

export function SignalCard({
  wallet,
  tokenSymbol,
  volumeUsd,
  explanation,
  source,
  timestamp,
  isSafe,
  tokenName,
  actionLabel,
  severityLabel,
  isBlocked,
  isCaution,
}: SignalCardProps) {
  const presentation = getSignalPresentation({ source, isSafe, isCaution });
  const SignalIcon = presentation.icon;
  const InsightIcon = presentation.insightIcon;

  return (
    <div className={`${presentation.cardClassName} p-5 rounded-lg flex flex-col gap-3`}>
      <div className="flex justify-between items-start">
        <div className="flex gap-4">
          <div className={presentation.iconWrapClassName}>
            <SignalIcon className={presentation.iconClassName} size={20} strokeWidth={1.75} />
          </div>
          <div>
            <h3 className={`font-display-lg text-lg ${presentation.titleClassName}`}>
              {tokenName} <span className="text-on-surface-variant text-sm">({tokenSymbol})</span>
            </h3>
            <div className={`font-data-md ${presentation.volumeClassName}`}>
              {formatUsd(volumeUsd)} {actionLabel}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className={presentation.badgeClassName}>{presentation.badgeLabel}</span>
          <span className="text-[10px] font-data-sm text-on-surface-variant mt-2">
            {timestamp}
          </span>
        </div>
      </div>
      <div className={presentation.insightClassName}>
        <div className="flex items-center gap-2 mb-2">
          <InsightIcon className={presentation.insightIconClassName} size={14} strokeWidth={1.75} />
          <span className={presentation.insightLabelClassName}>{presentation.insightLabel}</span>
        </div>
        <p className={presentation.explanationClassName}>{explanation}</p>
      </div>
      {isBlocked || isSafe ? (
        <div className="flex justify-between items-center pt-2 border-t border-outline-variant/30">
          <div className="flex gap-4">
            <span className="text-[10px] font-data-sm text-on-surface-variant uppercase">
              Wallet: {wallet}
            </span>
            <span className="text-[10px] font-data-sm text-on-surface-variant uppercase">
              {severityLabel}
            </span>
          </div>
          {presentation.footerAction}
        </div>
      ) : null}
    </div>
  );
}

export type { SignalCardProps };
