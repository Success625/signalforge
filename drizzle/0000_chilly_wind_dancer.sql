CREATE TABLE "last_seen" (
	"wallet_address" text PRIMARY KEY NOT NULL,
	"tx_hash" text,
	"block_unix_time" bigint,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet" text NOT NULL,
	"token_symbol" text,
	"token_address" text,
	"volume_usd" numeric(20, 2),
	"tx_hash" text,
	"source" text,
	"timestamp" bigint,
	"explanation" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wallets" (
	"address" text PRIMARY KEY NOT NULL,
	"pnl" numeric(20, 2),
	"trade_count" integer,
	"win_rate" numeric(5, 2),
	"updated_at" timestamp with time zone DEFAULT now()
);
