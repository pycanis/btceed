import { sha256 } from "@noble/hashes/sha256";
import { hex } from "@scure/base";
import { HDKey } from "@scure/bip32";
import { initEccLib, payments } from "bitcoinjs-lib";
import { useCallback, useEffect, useState } from "react";
import { isXOnlyPoint, xOnlyPointAddTweak } from "tiny-secp256k1";
import "./App.css";

type ScriptType = "p2wpkh" | "p2tr" | "p2pkh";

type Transaction = {
  txid: string;
  blockhash: string;
  // todo
};

// type HistoryItem = {
//   height: number;
//   tx_hash: string;
// };

type Address = {
  address: string;
  scriptHash: string;
  isChange: boolean;
  index: number;
  transactions: Transaction[];
};

initEccLib({
  isXOnlyPoint,
  xOnlyPointAddTweak,
});

const xpub = "";

const hdKey = HDKey.fromExtendedKey(xpub);

const scriptType: ScriptType = "p2wpkh";

const GAP_LIMIT = 20;

const GET_HISTORY = "blockchain.scripthash.get_history";
const GET_TRANSACTION = "blockchain.transaction.get";

const getPayment = (publicKey: Uint8Array, scriptType: ScriptType) => {
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
};

const getScriptHash = (output: Uint8Array) => hex.encode(sha256(output).reverse());

const getAddresses = (
  hdKey: HDKey,
  scriptType: ScriptType,
  isChange: boolean,
  startIndex: number,
  limit = GAP_LIMIT
) => {
  const addresses: Address[] = [];

  for (let i = startIndex; i < startIndex + limit; i++) {
    const { publicKey } = hdKey.deriveChild(isChange ? 1 : 0).deriveChild(i);

    const { address, output } = getPayment(publicKey!, scriptType);

    addresses.push({
      address: address!,
      scriptHash: getScriptHash(output!),
      isChange,
      index: i,
      transactions: [],
    });
  }

  return addresses;
};

const socket = new WebSocket("ws://192.168.4.11:50003");

function App() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [lastActiveIndexes, setLastActiveIndexes] = useState({ receive: 0, change: 0 });
  // const [_txIdsToPull, setTxIdsToPull] = useState<string[]>([]);

  const getAddressesHistory = useCallback((addresses: Address[]) => {
    setAddresses((prev) => [...prev, ...addresses]);

    for (const address of addresses) {
      socket.send(
        JSON.stringify({
          id: `${GET_HISTORY}-${address.scriptHash}-${address.index}-${address.isChange}`,
          method: GET_HISTORY,
          params: [address.scriptHash],
        })
      );
    }
  }, []);

  const getAdditionalAddresses = useCallback(
    (isChange: boolean) => {
      const typeAddresses = addresses.filter((address) => address.isChange === isChange);

      const lastActiveIndex = isChange ? lastActiveIndexes.change : lastActiveIndexes.receive;

      const limitDiff = typeAddresses.length - GAP_LIMIT;

      if (limitDiff < 0) {
        return;
      }

      const missingAddressesCount = lastActiveIndex + 1 - limitDiff;

      if (missingAddressesCount <= 0) {
        return;
      }

      getAddressesHistory(getAddresses(hdKey, scriptType, isChange, typeAddresses.length, missingAddressesCount));
    },
    [addresses, getAddressesHistory, lastActiveIndexes]
  );

  useEffect(() => {
    socket.onopen = () => {
      console.log("Connected to the Fulcrum server");

      getAddressesHistory([...getAddresses(hdKey, scriptType, false, 0), ...getAddresses(hdKey, scriptType, true, 0)]);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (!data.id) {
        return;
      }

      const [method, ...params] = data.id.split("-");

      switch (method) {
        case GET_HISTORY: {
          const [scriptHash, indexParam, isChangeParam] = params;

          for (const historyItem of data.result) {
            socket.send(
              JSON.stringify({
                id: `${GET_TRANSACTION}-${scriptHash}`,
                method: GET_TRANSACTION,
                params: [historyItem.tx_hash, true],
              })
            );
          }

          if (data.result.length > 0) {
            const isChange = isChangeParam === "true";
            const index = Number(indexParam);

            setLastActiveIndexes((prev) => ({
              receive: !isChange && index > prev.receive ? index : prev.receive,
              change: isChange && index > prev.change ? index : prev.change,
            }));
          }

          // setTxIdsToPull((prev) => [...prev, ...data.result.map((r: HistoryItem) => r.tx_hash)]);

          break;
        }

        case GET_TRANSACTION: {
          const scriptHash = params[0];

          setAddresses((prevAddresses) =>
            prevAddresses.map((address) => ({
              ...address,
              transactions:
                address.scriptHash === scriptHash ? [...address.transactions, data.result] : address.transactions,
            }))
          );

          break;
        }

        default: {
          console.log("Unknown message.");
        }
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("Connection closed");
    };
  }, [getAddressesHistory]);

  useEffect(() => {
    getAdditionalAddresses(false);
    getAdditionalAddresses(true);
  }, [getAdditionalAddresses]);

  console.log(addresses);

  return <>hello</>;
}

export default App;
