"use client";

import { useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  Filter,
  Flame,
  Menu,
  navIcons,
  RefreshCw,
  Users,
} from "./icons";
import {
  headerMetrics,
  primaryNavItems,
  signalFeedItems,
  trackedWallets,
  utilityNavItems,
} from "./mock-data";
import { SignalCard } from "./signal-card";
import { WalletCard } from "./wallet-card";

type HeaderProps = {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
};

function Header({ isSidebarOpen, onToggleSidebar }: HeaderProps) {
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
        {headerMetrics.map((metric, index) => (
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

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      <nav
        className={`fixed left-0 top-16 h-[calc(100vh-64px)] w-64 z-50 flex flex-col justify-between border-r border-outline-variant bg-surface-container-lowest transform transition-transform duration-300 lg:z-40 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col">
          <div className="py-4">
            {primaryNavItems.map((item) => {
              const Icon = navIcons[item.icon];

              return (
                <a
                  key={item.label}
                  className={
                    item.active
                      ? "bg-surface-container-high text-primary-container border-l-2 border-primary-container flex items-center gap-3 px-4 py-3"
                      : "text-on-surface-variant flex items-center gap-3 px-4 py-3 hover:bg-surface-container transition-all duration-200"
                  }
                  href={item.href}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  <span className="font-label-md text-label-md">
                    {item.label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
        <div className="p-4 border-t border-outline-variant flex flex-col gap-1">
          {utilityNavItems.map((item) => {
            const Icon = navIcons[item.icon];

            return (
              <a
                key={item.label}
                className="text-on-surface-variant flex items-center gap-3 px-4 py-2 hover:text-on-surface text-sm"
                href={item.href}
              >
                <Icon size={14} strokeWidth={1.75} />
                <span className="font-label-md text-label-md">
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>
      </nav>
    </>
  );
}

type TrackedWalletsPanelProps = {
  activeWalletAddress: string;
  onSelectWallet: (address: string) => void;
};

function TrackedWalletsPanel({
  activeWalletAddress,
  onSelectWallet,
}: TrackedWalletsPanelProps) {
  return (
    <section className="w-full lg:w-[30%] border-b lg:border-b-0 lg:border-r border-outline-variant flex flex-col bg-surface-container-low/30 min-h-[400px] lg:min-h-0 overflow-hidden">
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
        {trackedWallets.map((wallet) => (
          <WalletCard
            key={wallet.address}
            {...wallet}
            isActive={wallet.address === activeWalletAddress}
            onSelect={onSelectWallet}
          />
        ))}
      </div>
    </section>
  );
}

function LiveSignalFeedPanel() {
  return (
    <section className="w-full lg:w-[45%] flex flex-col bg-background min-h-[400px] lg:min-h-0 overflow-hidden">
      <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
        <h2 className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
          Live Signal Feed
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-data-sm text-primary-container">
            BUFFERING: 0.2ms
          </span>
          <RefreshCw
            className="text-on-surface-variant"
            size={16}
            strokeWidth={1.75}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[60vh] lg:max-h-none p-4 space-y-4">
        {signalFeedItems.map((signal) => (
          <SignalCard
            key={`${signal.tokenSymbol}-${signal.timestampLabel}`}
            wallet={signal.wallet}
            tokenSymbol={signal.tokenSymbol}
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
        ))}
      </div>
    </section>
  );
}

function IntelligenceSummaryPanel() {
  return (
    <section className="w-full lg:w-[25%] border-t lg:border-t-0 lg:border-l border-outline-variant flex flex-col bg-surface-container-lowest min-h-[400px] lg:min-h-0 overflow-hidden">
      <div className="p-4 border-b border-outline-variant bg-surface-container-low">
        <h2 className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">
          Intelligence Summary
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto max-h-[60vh] lg:max-h-none p-4 space-y-6">
        <div className="bg-surface-container-low border border-outline-variant p-4 rounded-lg w-full max-w-[720px] mx-auto">
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
        <div className="bg-surface-container-highest border border-primary-container/30 p-4 rounded-lg w-full max-w-[720px] mx-auto">
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
        <div className="w-full max-w-[720px] mx-auto">
          <div className="font-label-md text-[10px] text-on-surface-variant mb-3 uppercase flex items-center gap-2">
            <BarChart3
              className="text-on-surface-variant"
              size={16}
              strokeWidth={1.75}
            />
            Top Performers (24h)
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-surface-container rounded border border-outline-variant hover:border-primary-container/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="text-sm">🥇</span>
                <span className="font-data-sm text-on-surface">0x92...a1</span>
              </div>
              <span className="font-data-sm text-primary-container">+142%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-container rounded border border-outline-variant">
              <div className="flex items-center gap-3">
                <span className="text-sm">🥈</span>
                <span className="font-data-sm text-on-surface">0x33...bb</span>
              </div>
              <span className="font-data-sm text-primary-container">+88%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-surface-container rounded border border-outline-variant">
              <div className="flex items-center gap-3">
                <span className="text-sm">🥉</span>
                <span className="font-data-sm text-on-surface">0x12...c4</span>
              </div>
              <span className="font-data-sm text-primary-container">+71%</span>
            </div>
          </div>
        </div>
        <div className="bg-surface-container p-4 rounded-lg border border-outline-variant w-full max-w-[720px] mx-auto">
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
  const initialActiveWallet =
    trackedWallets.find((wallet) => wallet.isActive)?.address ??
    trackedWallets[0]?.address ??
    "";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeWalletAddress, setActiveWalletAddress] =
    useState(initialActiveWallet);

  return (
    <div className="bg-background text-on-surface font-body-md overflow-hidden min-h-screen">
      <div className="scanline-overlay" />
      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="ml-0 lg:ml-64 mt-16 h-[calc(100vh-64px)] overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row gap-0">
        <TrackedWalletsPanel
          activeWalletAddress={activeWalletAddress}
          onSelectWallet={setActiveWalletAddress}
        />
        <LiveSignalFeedPanel />
        <IntelligenceSummaryPanel />
      </main>
    </div>
  );
}
