import { initEccLib } from "bitcoinjs-lib";
import { useCallback, useEffect, useState } from "react";
import { isXOnlyPoint, xOnlyPointAddTweak } from "tiny-secp256k1";
import { AddressService } from "./AddressService";
import "./App.css";
import { GAP_LIMIT, GET_HISTORY, GET_TRANSACTION } from "./constants";
import { Address, ScriptType } from "./types";

initEccLib({
  isXOnlyPoint,
  xOnlyPointAddTweak,
});

const xpub = "";

const scriptType: ScriptType = "p2wpkh";

const addressService = new AddressService(xpub, scriptType);

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

      getAddressesHistory(addressService.deriveAddressRange(isChange, typeAddresses.length, missingAddressesCount));
    },
    [addresses, getAddressesHistory, lastActiveIndexes]
  );

  useEffect(() => {
    socket.onopen = () => {
      console.log("Connected to the Fulcrum server");

      getAddressesHistory([...addressService.deriveAddressRange(false), ...addressService.deriveAddressRange(true)]);
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
