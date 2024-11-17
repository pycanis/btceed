import { sha256 } from "@noble/hashes/sha256";
import { hex } from "@scure/base";
import { HDKey } from "@scure/bip32";
import { initEccLib, payments } from "bitcoinjs-lib";
import { useEffect, useState } from "react";
import { isXOnlyPoint, xOnlyPointAddTweak } from "tiny-secp256k1";
import "./App.css";

initEccLib({
  isXOnlyPoint,
  xOnlyPointAddTweak,
});

const xpub = "";

const hdKey = HDKey.fromExtendedKey(xpub);

const GAP = 20;

type ScriptType = "p2wpkh" | "p2tr" | "p2pkh";

type Address = {
  address: string;
  scriptHash: string;
  isChange: boolean;
  index: number;
  transactions: Transaction[];
};

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

const getScriptHash = (output: Uint8Array) =>
  hex.encode(sha256(output).reverse());

const getAddresses = (
  hdKey: HDKey,
  scriptType: ScriptType,
  startIndex: number,
  isChange: boolean
) => {
  const addresses: Address[] = [];

  for (let i = startIndex; i < startIndex + GAP; i++) {
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

const GET_HISTORY = "blockchain.scripthash.get_history";
const GET_TRANSACTION = "blockchain.transaction.get";

const socket = new WebSocket("ws://192.168.4.11:50003");

type Transaction = {
  txid: string;
  blockhash: string;
  // todo
};

// type HistoryItem = {
//   height: number;
//   tx_hash: string;
// };

function App() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  //  const [_txIdsToPull, setTxIdsToPull] = useState<string[]>([]);

  useEffect(() => {
    const initialAddresses = [
      ...getAddresses(hdKey, "p2wpkh", 0, false),
      ...getAddresses(hdKey, "p2wpkh", 0, true),
    ];

    setAddresses(initialAddresses);

    socket.onopen = () => {
      console.log("Connected to the Fulcrum server");

      for (const address of initialAddresses) {
        socket.send(
          JSON.stringify({
            id: `${GET_HISTORY}-${address.scriptHash}`,
            method: GET_HISTORY,
            params: [address.scriptHash],
          })
        );
      }
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (!data.id) {
        return;
      }

      const [method, ...params] = data.id.split("-");

      switch (method) {
        case GET_HISTORY: {
          const scriptHash = params[0];

          for (const historyItem of data.result) {
            socket.send(
              JSON.stringify({
                id: `${GET_TRANSACTION}-${scriptHash}`,
                method: GET_TRANSACTION,
                params: [historyItem.tx_hash, true],
              })
            );
          }

          // setTxIdsToPull((prev) => [
          //   ...prev,
          //   ...data.result.map((r: HistoryItem) => r.tx_hash),
          // ]);

          break;
        }

        case GET_TRANSACTION: {
          const scriptHash = params[0];

          setAddresses((prevAddresses) =>
            prevAddresses.map((address) => ({
              ...address,
              transactions:
                address.scriptHash === scriptHash
                  ? [...address.transactions, data.result]
                  : address.transactions,
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
  }, []);

  console.log(addresses);

  return <>hello</>;
}

export default App;
