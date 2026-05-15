import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import AppLayout from "@/components/AppLayout";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "SMART WALLET SIGNAL FEED | TERMINAL",
  description:
    "Real-time insights into smart wallet activity. Track top-performing wallets, receive actionable signals, and stay ahead in the crypto market with our comprehensive dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetBrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-body-md">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
