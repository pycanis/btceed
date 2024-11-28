import { HDKey } from "@scure/bip32";
import { XpubStoreValue } from "../types";

export const getWallet = ({ xpub, scriptType, label }: XpubStoreValue) => ({
  hdKey: HDKey.fromExtendedKey(xpub),
  scriptType,
  label,
});
