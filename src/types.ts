export type ScriptType = "p2wpkh" | "p2tr" | "p2pkh";

export type Vin = {
  scriptSig: { asm: string; hex: string };
  sequence: number;
  txid: string;
  txwitness: string[];
  vout: number;
};

export type Vout = {
  n: number;
  value: number;
  scriptPubKey: { address: string; asm: string; desc: string; hex: string; type: string };
};

export type Transaction = {
  txid: string;
  blockhash: string;
  blocktime: number;
  confirmations: number;
  hash: string;
  hex: string;
  locktime: number;
  size: number;
  time: number;
  version: number;
  vsize: number;
  weight: number;
  vin: Vin[];
  vout: Vout[];
};

export type Address = {
  address: string;
  scriptHash: string;
  isChange: boolean;
  index: number;
  transactions: Transaction[];
};

export type HistoryItem = {
  tx_hash: string;
  height: number;
};
