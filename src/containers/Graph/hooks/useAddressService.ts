import { sha256 } from "@noble/hashes/sha256";
import { hex } from "@scure/base";
import { payments } from "bitcoinjs-lib";
import { useCallback, useMemo } from "react";
import { GAP_LIMIT } from "../../../constants";
import { Wallet } from "../../../contexts/WalletContext";
import { AddressEntry, ScriptType } from "../../../types";

export const useAddressService = () => {
  const getPayment = useCallback((publicKey: Uint8Array, scriptType: ScriptType) => {
    // todo: add all script types
    switch (scriptType) {
      case "p2wpkh":
        return payments.p2wpkh({
          pubkey: publicKey,
        });
      case "p2tr":
        return payments.p2tr({
          internalPubkey: publicKey.slice(1),
        });
      default:
        throw new Error("Unknown script type");
    }
  }, []);

  const getScriptHash = useCallback((output: Uint8Array) => {
    return hex.encode(sha256(output).reverse());
  }, []);

  const deriveAddress = useCallback(
    (wallet: Wallet, index: number, isChange: boolean): AddressEntry => {
      const { publicKey } = wallet.hdKey.deriveChild(isChange ? 1 : 0).deriveChild(index);

      if (!publicKey) {
        throw new Error(`Failed to derive public key for index ${index}`);
      }

      const { address, output } = getPayment(publicKey, wallet.scriptType);

      if (!address || !output) {
        throw new Error(`Failed to generate address for index ${index}`);
      }

      return {
        address,
        scriptHash: getScriptHash(output),
        isChange,
        index,
        transactionIds: [],
        xpub: wallet.hdKey.publicExtendedKey,
      };
    },
    [getScriptHash, getPayment]
  );

  const deriveAddressRange = useCallback(
    (wallet: Wallet, isChange: boolean, startIndex = 0, limit = GAP_LIMIT): AddressEntry[] =>
      Array.from({ length: limit }, (_, i) => deriveAddress(wallet, startIndex + i, isChange)),
    [deriveAddress]
  );

  return useMemo(
    () => ({
      deriveAddressRange,
    }),
    [deriveAddressRange]
  );
};
