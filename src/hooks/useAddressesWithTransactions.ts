import { useCallback, useEffect, useMemo, useState } from "react";
import { AddressService } from "../AddressService";
import { GAP_LIMIT, GET_HISTORY, GET_TRANSACTION } from "../constants";
import { ElectrumService } from "../ElectrumService";
import { Address, HistoryItem, ScriptType, Transaction } from "../types";

const LAST_ACTIVE_INDEXES_DEFAULT = { receive: 0, change: 0 };

export const useAddressesWithTransactions = (
  xpub: string,
  scriptType: ScriptType,
  electrumService: ElectrumService
) => {
  const [addresses, setAddresses] = useState<Record<string, Address>>({});
  const [lastActiveIndexes, setLastActiveIndexes] = useState(LAST_ACTIVE_INDEXES_DEFAULT);
  // const [_txIdsToPull, setTxIdsToPull] = useState<string[]>([]);

  const addressService = useMemo(() => new AddressService(xpub, scriptType), [xpub, scriptType]);

  const getAddressesHistory = useCallback(
    (addresses: Address[]) => {
      const addressRecord = addresses.reduce((acc, address) => {
        acc[address.address] = address;

        return acc;
      }, {} as Record<string, Address>);

      setAddresses((prev) => ({ ...prev, ...addressRecord }));

      for (const address of addresses) {
        electrumService.sendMessage({
          id: `${GET_HISTORY}-${address.scriptHash}-${address.index}-${address.isChange}`,
          method: GET_HISTORY,
          params: [address.scriptHash],
        });
      }
    },
    [electrumService]
  );

  const handleElectrumConnect = useCallback(
    () =>
      getAddressesHistory([...addressService.deriveAddressRange(false), ...addressService.deriveAddressRange(true)]),
    [addressService, getAddressesHistory]
  );

  const handleElectrumMessage = useCallback(
    (data?: unknown) => {
      const { id, result } = data as { id: string; result: unknown };

      if (!id) {
        return;
      }

      const [method, ...params] = id.split("-");

      switch (method) {
        case GET_HISTORY: {
          const [scriptHash, indexParam, isChangeParam] = params;

          const historyItems = result as HistoryItem[];

          for (const historyItem of historyItems) {
            electrumService.sendMessage({
              id: `${GET_TRANSACTION}-${scriptHash}`,
              method: GET_TRANSACTION,
              params: [historyItem.tx_hash, true],
            });
          }

          if (historyItems.length > 0) {
            const isChange = isChangeParam === "true";
            const index = Number(indexParam);

            setLastActiveIndexes((prev) => ({
              receive: !isChange && index > prev.receive ? index : prev.receive,
              change: isChange && index > prev.change ? index : prev.change,
            }));
          }

          // setTxIdsToPull((prev) => [...prev, ...historyItems.map(r => r.tx_hash)]);

          break;
        }

        case GET_TRANSACTION: {
          const scriptHash = params[0];

          const transaction = result as Transaction;

          setAddresses((prevAddresses) => {
            const addressToUpdate = Object.values(prevAddresses).find((a) => a.scriptHash === scriptHash)!;

            return {
              ...prevAddresses,
              [addressToUpdate.address]: {
                ...addressToUpdate,
                transactions: [...addressToUpdate.transactions, transaction],
              },
            };
          });

          break;
        }

        default: {
          console.log("Unknown message.");
        }
      }
    },
    [electrumService]
  );

  const getAdditionalAddresses = useCallback(
    (isChange: boolean) => {
      const typeAddresses = Object.keys(addresses).filter((address) => addresses[address].isChange === isChange);

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
    [addresses, getAddressesHistory, lastActiveIndexes, addressService]
  );

  useEffect(() => {
    electrumService.on("open", handleElectrumConnect);
    electrumService.on("message", handleElectrumMessage);
  }, [electrumService, handleElectrumConnect, handleElectrumMessage]);

  useEffect(() => {
    getAdditionalAddresses(false);
    getAdditionalAddresses(true);
  }, [getAdditionalAddresses]);

  useEffect(() => {
    setAddresses({});
    setLastActiveIndexes(LAST_ACTIVE_INDEXES_DEFAULT);
  }, [xpub, scriptType]);

  return useMemo(() => addresses, [addresses]);
};
