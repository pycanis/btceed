import { z } from "zod";

export const historySchema = z.object({ tx_hash: z.string() });

export const transactionSchema = z.object({
  time: z.number(),
  txid: z.string(),
  vin: z.array(
    z.object({
      txid: z.string(),
      vout: z.number(),
    })
  ),
  vout: z.array(
    z.object({
      n: z.number(),
      scriptPubKey: z.object({
        address: z.string(),
      }),
      value: z.number(),
    })
  ),
});

export const electrumResponseSchema = z.array(
  z.object({
    id: z.string(),
    result: z.union([z.array(historySchema), transactionSchema]),
  })
);
