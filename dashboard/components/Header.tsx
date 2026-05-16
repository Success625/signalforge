"use client";

import Image from "next/image";
import { Menu } from "./signal-feed/icons";
import { useDashboard } from "./DashboardContext";

type HeaderProps = {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export function Header({ isSidebarOpen, onToggleSidebar }: HeaderProps) {
  const { signals, wallets } = useDashboard();

  const unsafeBlockedCount = signals.filter((s) => s.isBlocked).length;
  
  const metrics = [
    { label: "SIGNALS TODAY", value: signals.length.toString() },
    { label: "WALLETS TRACKED", value: wallets.length.toString() },
    { label: "UNSAFE BLOCKED", value: unsafeBlockedCount.toString(), valueClassName: "text-error" },
    { label: "UPTIME", value: "99.9%", valueClassName: "text-primary-container" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 min-h-16 flex flex-col gap-4 px-4 pt-3 pb-2 lg:h-16 lg:flex-row lg:items-center lg:justify-between lg:px-6 bg-surface-container-low/95 backdrop-blur-md border-b border-outline-variant">
      <div className="flex flex-wrap items-center gap-3">
        <button
          aria-expanded={isSidebarOpen}
          aria-label="Toggle navigation"
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-md border border-outline-variant text-on-surface-variant hover:text-primary-container hover:border-primary-container/50 transition-colors"
          onClick={onToggleSidebar}
          type="button"
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>
        <div className="w-8 h-8 rounded-md border border-outline-variant bg-surface-container-highest flex items-center justify-center overflow-hidden">
          <Image
            alt="SignalForge logo"
            src="/logo.png"
            width={32}
            height={32}
          />
        </div>
        <h1 className="font-display-lg text-[18px] sm:text-display-lg text-primary-container tracking-tighter uppercase leading-tight">
          SIGNALFORGE
        </h1>
        <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-outline-variant">
          <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse-dot" />
          <span className="font-label-md text-label-md text-primary-container">
            LIVE
          </span>
        </div>
      </div>
      <div className="hidden lg:flex items-center gap-8">
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className={
              index === 0
                ? "flex flex-col items-end"
                : "flex flex-col items-end border-l border-outline-variant pl-8"
            }
          >
            <span className="font-label-md text-[10px] text-on-surface-variant uppercase">
              {metric.label}
            </span>
            <span
              className={`font-data-md text-data-md text-on-surface ${metric.valueClassName ?? ""}`}
            >
              {metric.value}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4" />
    </header>
  );
}
