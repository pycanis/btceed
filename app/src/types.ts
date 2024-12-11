import { Node } from "@xyflow/react";
import { DBSchema } from "idb";
import { TypeOf } from "zod";
import { historySchema, transactionSchema } from "./validators";

export enum ScriptType {
  P2PKH = "P2PKH",
  //  "P2SH-P2WPKH" = "P2SH-P2WPKH",
  P2WPKH = "P2WPKH",
  P2TR = "P2TR",
}

export type Transaction = TypeOf<typeof transactionSchema>;

export type HistoryItem = TypeOf<typeof historySchema>;

export type AddressEntry = {
  address: string;
  scriptHash: string;
  isChange: boolean;
  index: number;
  transactionIds?: string[];
  xpub: string;
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
  xpub: string;
  scriptType: ScriptType;
};

export type ColorScheme = "light" | "dark" | "system";

export type NodeColors = {
  xpubNode: string;
  xpubAddress: string;
  changeAddress: string;
  externalAddress: string;
};

export type WalletsStoreValue = { xpub: string; scriptType: ScriptType; createdAt: number };

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
  miniMap: boolean;
  currency?: Currencies;
};

// id is either xpub, address or transaction id
export type LabelStoreValue = { label: string; id: string };

export enum Currencies {
  AUD = "AUD",
  CAD = "CAD",
  CHF = "CHF",
  EUR = "EUR",
  GBP = "GBP",
  JPY = "JPY",
  USD = "USD",
}

export type ExchangeRatesStoreValue = { tsInSeconds: number; rates: Record<Currencies, number> };

export interface DatabaseSchema extends DBSchema {
  wallets: { key: string; value: WalletsStoreValue; indexes: { createdAt: number } };
  settings: { key: number; value: SettingsStoreValue };
  labels: { key: string; value: LabelStoreValue };
  exchangeRates: { key: number; value: ExchangeRatesStoreValue };
}

export type Totals = { totalSpent: number; totalReceived: number; totalFee: number; transactionsCount: number };
