import { sha256 } from "@noble/hashes/sha256";
import { hex } from "@scure/base";
import { HDKey } from "@scure/bip32";
import { initEccLib, payments } from "bitcoinjs-lib";
import { isXOnlyPoint, xOnlyPointAddTweak } from "tiny-secp256k1";
import { GAP_LIMIT } from "./constants";
import { AddressEntry, ScriptType } from "./types";

initEccLib({
  isXOnlyPoint,
  xOnlyPointAddTweak,
});

export class AddressService {
  private hdKey: HDKey;
  private scriptType: ScriptType;

  constructor(xpub: string, scriptType: ScriptType) {
    this.hdKey = HDKey.fromExtendedKey(xpub);
    this.scriptType = scriptType;
  }

  private getPayment = (publicKey: Uint8Array) => {
    // todo: add all script types
    switch (this.scriptType) {
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
  };

  private getScriptHash(output: Uint8Array): string {
    return hex.encode(sha256(output).reverse());
  }

  private deriveAddress(index: number, isChange: boolean): AddressEntry {
    const { publicKey } = this.hdKey.deriveChild(isChange ? 1 : 0).deriveChild(index);

    if (!publicKey) {
      throw new Error(`Failed to derive public key for index ${index}`);
    }

    const { address, output } = this.getPayment(publicKey);

    if (!address || !output) {
      throw new Error(`Failed to generate address for index ${index}`);
    }

    return {
      address,
      scriptHash: this.getScriptHash(output),
      isChange,
      index,
      transactionIds: [],
    };
  }

  public deriveAddressRange(isChange: boolean, startIndex = 0, limit = GAP_LIMIT): AddressEntry[] {
    return Array.from({ length: limit }, (_, i) => this.deriveAddress(startIndex + i, isChange));
  }
}
