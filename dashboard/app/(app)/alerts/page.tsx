import React from "react";
import { BellRing } from "lucide-react";

export default function AlertsPage() {
  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto flex flex-col gap-8 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="font-display-lg text-3xl text-primary-container uppercase tracking-tighter">
          Alerts
        </h1>
        <p className="text-on-surface-variant text-sm max-w-2xl">
          Real-time alerts and notifications from the SignalForge intelligence engine.
        </p>
      </div>

      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-6 lg:p-12 flex flex-col items-center justify-center text-center gap-6 min-h-[50vh]">
        <div className="w-20 h-20 rounded-full bg-primary-container/10 flex items-center justify-center border border-primary-container/20">
          <BellRing className="text-primary-container" size={36} strokeWidth={1.5} />
        </div>
        
        <div className="flex flex-col gap-3 max-w-lg">
          <h2 className="font-display-md text-2xl text-on-surface uppercase tracking-tight">
            Alerts via Telegram
          </h2>
          <p className="text-on-surface-variant text-base leading-relaxed">
            All high-priority signals, smart money movements, and roster updates are immediately broadcasted to our official Telegram channel. Stay ahead of the market by subscribing to the feed.
          </p>
        </div>

        <a 
          href="https://t.me/smartwalletsignals"
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-4 bg-primary-container text-on-primary-container hover:bg-primary-container/90 px-8 py-4 rounded-lg font-label-md uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary-container/20 flex items-center gap-3"
        >
          Join Telegram Channel
        </a>
      </div>
    </div>
  );
}
