import { Currencies, ScriptType, SettingsStoreValue } from "./types";

export const VITE_ELECTRUM_WS_SERVER_URL = import.meta.env.VITE_ELECTRUM_WS_SERVER_URL;
export const VITE_BLOCKCHAIN_EXPLORER_URL = import.meta.env.VITE_BLOCKCHAIN_EXPLORER_URL;
export const VITE_ENABLE_DEFAULT_WALLET = import.meta.env.VITE_ENABLE_DEFAULT_WALLET;

export const DEFAULT_XPUB =
  "xpub6CDmLSu45NuhjezGYMCF6jSL8BX46xFeLDCqn4dUKcdNMuKJMWtpfj9K12C3MZ9WedceiA4uKz5EXrNrFuHhyxgGnpcJGhJpEMBkRfXz7FL";

export const DEFAULT_SCRIPT_TYPE = ScriptType.P2TR;

export const GAP_LIMIT = 20;

export const SATS_IN_BTC = 100000000;

export const XPUB_HEX_PREFIX = "0488b21e";

export const GET_HISTORY = "blockchain.scripthash.get_history";
export const GET_TRANSACTION = "blockchain.transaction.get";

export const DB_NAME = "main";
export const DB_VERSION = 1;

export const GET_DB_WALLETS = "wallets";
export const GET_DB_SETTINGS = "settings";
export const GET_DB_LABELS = "labels";
export const GET_DB_EXCHANGE_RATES = "exchangeRates";

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
  graphSpacing: 200,
  nodeColors: DEFAULT_NODE_COLORS_LIGHT_MODE,
  nodeColorsDark: DEFAULT_NODE_COLORS_DARK_MODE,
  valuesInSats: false,
  showAddressesWithoutTransactions: false,
  nodeSpacing: 50,
  currency: Currencies.USD,
  miniMap: false,
};

export const SCRIPT_DERIVATION_PATH_BASE: Record<ScriptType, string> = {
  P2PKH: "m/44'/0'/0'",
  P2WPKH: "m/84'/0'/0'",
  P2TR: "m/86'/0'/0'",
};
