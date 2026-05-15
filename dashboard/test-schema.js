import { z } from "zod";

const walletResponseSchema = z.array(
  z.object({
    address: z.string(),
    pnl: z.number().nullable().optional(),
    tradeCount: z.number().nullable().optional(),
    winRate: z.number().nullable().optional(),
  })
);

const payload = [
  {
    address: "0x123",
    pnl: "150.50",
    tradeCount: 5,
    winRate: "100.0"
  }
];

const result = walletResponseSchema.safeParse(payload);
console.log(JSON.stringify(result, null, 2));
