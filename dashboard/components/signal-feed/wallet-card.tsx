import type { KeyboardEventHandler } from "react";

import { Trophy } from "./icons";
import type { WalletItem } from "./types";

type WalletCardProps = WalletItem & {
  onSelect?: (address: string) => void;
};

export function WalletCard({
  address,
  pnl24h,
  winRate,
  isActive,
  isDimmed,
  isPremium,
  chartHeights,
  onSelect,
}: WalletCardProps) {
  const pnlClassName = pnl24h.startsWith("-")
    ? "text-error"
    : pnl24h.startsWith("+")
      ? "text-primary-container"
      : "text-on-surface";
  const cardWidthClassName = "w-full max-w-[720px] mx-auto";
  const resolvedChartHeights = chartHeights?.length
    ? chartHeights
    : ["30%", "55%", "40%", "70%", "50%"];
  const handleSelect = () => {
    onSelect?.(address);
  };
  const handleKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect?.(address);
    }
  };

  if (isActive) {
    return (
      <div
        className={`bg-surface-container-highest p-4 rounded-lg glow-border-active relative group cursor-pointer transition-transform duration-150 active:scale-[0.98] ${cardWidthClassName}`}
        role="button"
        tabIndex={0}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
      >
        <div className="flex justify-between items-start mb-2">
          <span className="font-data-md text-primary-container">{address}</span>
          {isPremium || isActive ? (
            <Trophy
              className="text-primary-container"
              size={18}
              strokeWidth={1.75}
              fill="currentColor"
            />
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-label-md">
              PnL (24h)
            </div>
            <div className={`font-data-md ${pnlClassName}`}>{pnl24h}</div>
          </div>
          <div>
            <div className="text-[10px] text-on-surface-variant uppercase font-label-md">
              Win Rate
            </div>
            <div className="font-data-md text-on-surface">{winRate}</div>
          </div>
        </div>
        <div
          className={`w-full flex items-end gap-1 transition-all duration-300 ease-out overflow-hidden ${
            isActive ? "mt-3 h-8 opacity-60" : "mt-0 h-0 opacity-0"
          }`}
        >
          {resolvedChartHeights.map((height, index) => (
            <div
              key={`${address}-${height}-${index}`}
              className={
                index === resolvedChartHeights.length - 1
                  ? "flex-1 bg-primary-container"
                  : "flex-1 bg-primary-container/20"
              }
              style={{ height }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-surface-container-low border border-outline-variant p-4 rounded-lg hover:border-outline transition-colors cursor-pointer ${cardWidthClassName}${
        isDimmed ? " opacity-80" : ""
      }`}
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="font-data-md text-on-surface">{address}</span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] text-on-surface-variant uppercase font-label-md">
            PnL (24h)
          </div>
          <div className={`font-data-md ${pnlClassName}`}>{pnl24h}</div>
        </div>
        <div>
          <div className="text-[10px] text-on-surface-variant uppercase font-label-md">
            Win Rate
          </div>
          <div className="font-data-md text-on-surface">{winRate}</div>
        </div>
      </div>
      <div
        className={`w-full flex items-end gap-1 transition-all duration-300 ease-out overflow-hidden ${
          isActive ? "mt-3 h-8 opacity-60" : "mt-0 h-0 opacity-0"
        }`}
      >
        {resolvedChartHeights.map((height, index) => (
          <div
            key={`${address}-${height}-${index}`}
            className={
              index === resolvedChartHeights.length - 1
                ? "flex-1 bg-primary-container"
                : "flex-1 bg-primary-container/20"
            }
            style={{ height }}
          />
        ))}
      </div>
    </div>
  );
}
