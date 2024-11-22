import { Node } from "@xyflow/react";

// todo: all types
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

export type AddressEntry = {
  address: string;
  scriptHash: string;
  isChange: boolean;
  index: number;
  transactionIds: string[];
};

export type HistoryItem = {
  tx_hash: string;
  height: number;
};

export type PositionlessNode = Omit<Node, "position">;

export type XpubNode = Node<
  {
    xpub: string;
    direction: Direction;
  },
  "xpubNode"
>;

export type AddressNode = Node<
  {
    address: string;
    direction: Direction;
    type: AddressNodeType;
  },
  "addressNode"
>;

export type AddressNodeType = "xpubAddress" | "changeAddress" | "externalAddress";

export type Direction = "TB" | "LR" | "RL" | "BT";
