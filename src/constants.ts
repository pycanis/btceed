import { ScriptType, SettingsStoreValue } from "./types";

export const GAP_LIMIT = 20;

export const GET_HISTORY = "blockchain.scripthash.get_history";
export const GET_TRANSACTION = "blockchain.transaction.get";

export const DB_NAME = "main";
export const DB_VERSION = 1;

export const GET_DB_XPUBS = "xpubs";
export const GET_DB_SETTINGS = "settings";

export const DEFAULT_NODE_COLORS_LIGHT_MODE = {
  xpubNode: "#d8b4fe",
  xpubAddress: "#fde047",
  changeAddress: "#fca5a5",
  externalAddress: "#d1d5db",
};

export const DEFAULT_NODE_COLORS_DARK_MODE = {
  xpubNode: "#d215fc",
  xpubAddress: "#2c650f",
  changeAddress: "#b31908",
  externalAddress: "#4d4b4e",
};

export const DEFAULT_SETTINGS: SettingsStoreValue = {
  panOnScroll: false,
  colorScheme: "system",
  direction: "TB",
  spacing: 200,
  nodeColors: DEFAULT_NODE_COLORS_LIGHT_MODE,
  nodeColorsDark: DEFAULT_NODE_COLORS_DARK_MODE,
};

export const SCRIPT_DERIVATION_PATH_BASE: Record<ScriptType, string> = {
  P2PKH: "m/44'/0'/0'",
  P2WPKH: "m/84'/0'/0'",
  P2TR: "m/86'/0'/0'",
};
