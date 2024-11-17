export type ScriptType = "p2wpkh" | "p2tr" | "p2pkh";

export type Transaction = {
  txid: string;
  blockhash: string;
  // Add other transaction fields
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
