import { sha256 } from "@noble/hashes/sha256";
import { HDKey } from "@scure/bip32";
import { initEccLib, payments } from "bitcoinjs-lib";
import { useCallback, useMemo } from "react";
import { isXOnlyPoint, xOnlyPointAddTweak } from "tiny-secp256k1";
import { GAP_LIMIT } from "../../../constants";
import { AddressEntry, ScriptType, Wallet } from "../../../types";

initEccLib({ isXOnlyPoint, xOnlyPointAddTweak });

const uint8ArrayToHex = (uint8Array: Uint8Array) =>
  Array.from(uint8Array)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

export const useAddressService = () => {
  const getPayment = useCallback((publicKey: Uint8Array, scriptType: ScriptType) => {
    switch (scriptType) {
      case ScriptType.P2PKH:
        return payments.p2pkh({
          pubkey: publicKey,
        });
      case ScriptType.P2WPKH:
        return payments.p2wpkh({
          pubkey: publicKey,
        });
      case ScriptType.P2TR:
        return payments.p2tr({
          internalPubkey: publicKey.slice(1),
        });
      default:
        throw new Error("Unknown script type");
    }
  }, []);

  const getScriptHash = useCallback((output: Uint8Array) => uint8ArrayToHex(sha256(output).reverse()), []);

  const deriveAddress = useCallback(
    (wallet: Wallet, index: number, isChange: boolean): AddressEntry => {
      const { publicKey } = HDKey.fromExtendedKey(wallet.xpub)
        .deriveChild(isChange ? 1 : 0)
        .deriveChild(index);

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
        xpub: wallet.xpub,
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
