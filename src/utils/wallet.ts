import { HDKey } from "@scure/bip32";
import { XpubStoreValue } from "../types";

export const getWallet = ({ xpub, scriptType }: XpubStoreValue) => ({
  hdKey: HDKey.fromExtendedKey(xpub),
  scriptType,
});
