import { SettingsStoreValue } from "./types";

export const GAP_LIMIT = 20;

export const GET_HISTORY = "blockchain.scripthash.get_history";
export const GET_TRANSACTION = "blockchain.transaction.get";

export const NODE_WIDTH = 96 / 1.5;
export const NODE_HEIGHT = 24 / 1.5;

export const DB_NAME = "main";
export const DB_VERSION = 1;

export const GET_DB_XPUBS = "xpubs";
export const GET_DB_SETTINGS = "settings";

export const DEFAULT_SETTINGS: SettingsStoreValue = {
  panOnScroll: false,
  colorScheme: "system" as const,
  direction: "TB",
};
