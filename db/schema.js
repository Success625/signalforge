import {
  pgTable,
  text,
  integer,
  bigint,
  numeric,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const wallets = pgTable("wallets", {
  address: text("address").primaryKey(),
  pnl: numeric("pnl", { precision: 20, scale: 2 }),
  tradeCount: integer("trade_count"),
  winRate: numeric("win_rate", { precision: 5, scale: 2 }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const lastSeen = pgTable("last_seen", {
  walletAddress: text("wallet_address").primaryKey(),
  txHash: text("tx_hash"),
  blockUnixTime: bigint("block_unix_time", { mode: "number" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const signals = pgTable("signals", {
  id: uuid("id").defaultRandom().primaryKey(),
  wallet: text("wallet").notNull(),
  tokenSymbol: text("token_symbol"),
  tokenAddress: text("token_address"),
  volumeUsd: numeric("volume_usd", { precision: 20, scale: 2 }),
  txHash: text("tx_hash"),
  source: text("source"),
  timestamp: bigint("timestamp", { mode: "number" }),
  explanation: text("explanation"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
