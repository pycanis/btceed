import { SettingsStoreValue } from "./types";

export const GAP_LIMIT = 20;

export const GET_HISTORY = "blockchain.scripthash.get_history";
export const GET_TRANSACTION = "blockchain.transaction.get";

export const DB_NAME = "main";
export const DB_VERSION = 1;

export const GET_DB_XPUBS = "xpubs";
export const GET_DB_SETTINGS = "settings";

export const DEFAULT_SETTINGS: SettingsStoreValue = {
  panOnScroll: false,
  colorScheme: "system",
  direction: "TB",
  spacing: 200,
  nodeColors: {
    xpubNode: "#d8b4fe",
    xpubAddress: "#fde047",
    changeAddress: "#fca5a5",
    externalAddress: "#d1d5db",
  },
};
