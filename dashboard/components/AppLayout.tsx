"use client";

import React, { useState } from "react";
import { Header } from "./Header";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="bg-background text-on-surface font-body-md overflow-hidden min-h-screen">
      <div className="scanline-overlay" />
      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className="ml-0 lg:ml-64 mt-16 h-[calc(100vh-64px)] overflow-y-auto lg:overflow-hidden">
        {children}
      </main>
    </div>
  );
}
