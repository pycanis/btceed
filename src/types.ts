import { HDKey } from "@scure/bip32";
import { Node } from "@xyflow/react";
import { DBSchema } from "idb";

export enum ScriptType {
  P2PKH = "P2PKH",
  //  "P2SH-P2WPKH" = "P2SH-P2WPKH",
  P2WPKH = "P2WPKH",
  P2TR = "P2TR",
}

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
  transactionIds?: string[];
  xpub: string;
};

export type HistoryItem = {
  tx_hash: string;
  height: number;
};

export type PositionlessNode = Omit<Node, "position">;

export type NodeType = "xpubNode" | "xpubAddress" | "changeAddress" | "externalAddress";

export type XpubNode = Node<
  {
    wallet: Wallet;
    totals: Totals;
  },
  "xpubNode"
>;

export type AddressNode = Node<
  {
    address: string;
    isChange?: boolean;
    index?: number;
    type: AddressNodeType;
    wallet: Wallet;
    transactions: Transaction[];
  },
  "addressNode"
>;

export type AddressNodeType = "xpubAddress" | "changeAddress" | "externalAddress";

export type Direction = "TB" | "LR" | "RL" | "BT";

export type Wallet = {
  hdKey: HDKey;
  scriptType: ScriptType;
};

export type ColorScheme = "light" | "dark" | "system";

export type NodeColors = {
  xpubNode: string;
  xpubAddress: string;
  changeAddress: string;
  externalAddress: string;
};

export type XpubStoreValue = { xpub: string; scriptType: ScriptType; createdAt: number };

export type SettingsStoreValue = {
  panOnScroll: boolean;
  colorScheme: ColorScheme;
  direction: Direction;
  graphSpacing: number;
  nodeColors: NodeColors;
  nodeColorsDark: NodeColors;
  valuesInSats: boolean;
  showAddressesWithoutTransactions: boolean;
  nodeSpacing: number;
};

// id is either xpub, address or transaction id
export type LabelStoreValue = { label: string; id: string };

export interface DatabaseSchema extends DBSchema {
  xpubs: { key: string; value: XpubStoreValue; indexes: { createdAt: number } };
  settings: { key: number; value: SettingsStoreValue };
  labels: { key: string; value: LabelStoreValue };
}

export type Totals = { totalSpent: number; totalReceived: number; totalFee: number; transactionsCount: number };
