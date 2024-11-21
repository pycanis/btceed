import { useCallback, useEffect, useMemo, useState } from "react";
import { AddressService } from "../../AddressService";
import { GAP_LIMIT, GET_HISTORY, GET_TRANSACTION } from "../../constants";
import { electrumService } from "../../ElectrumService";
import { AddressEntry, HistoryItem, ScriptType, Transaction } from "../../types";

const LAST_ACTIVE_INDEXES_DEFAULT = { receive: 0, change: 0 };

export const useAddressEntries = (xpub: string, scriptType: ScriptType) => {
  const [addressEntries, setAddressEntries] = useState<Record<string, AddressEntry>>({});
  const [lastActiveIndexes, setLastActiveIndexes] = useState(LAST_ACTIVE_INDEXES_DEFAULT);

  const addressService = useMemo(() => new AddressService(xpub, scriptType), [xpub, scriptType]);

  const getAddressEntriesHistory = useCallback((addressEntries: AddressEntry[]) => {
    const addressEntry = addressEntries.reduce((acc, address) => {
      acc[address.address] = address;

      return acc;
    }, {} as Record<string, AddressEntry>);

    setAddressEntries((prev) => ({ ...prev, ...addressEntry }));

    for (const addressEntry of addressEntries) {
      electrumService.sendMessage({
        id: `${GET_HISTORY}-${addressEntry.scriptHash}-${addressEntry.index}-${addressEntry.isChange}`,
        method: GET_HISTORY,
        params: [addressEntry.scriptHash],
      });
    }
  }, []);

  const handleElectrumConnect = useCallback(
    () =>
      getAddressEntriesHistory([
        ...addressService.deriveAddressRange(false),
        ...addressService.deriveAddressRange(true),
      ]),
    [addressService, getAddressEntriesHistory]
  );

  const handleElectrumMessage = useCallback((data?: unknown) => {
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

        break;
      }

      case GET_TRANSACTION: {
        const scriptHash = params[0];

        const transaction = result as Transaction;

        setAddressEntries((prevAddresses) => {
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
  }, []);

  const getAdditionalAddressEntries = useCallback(
    (isChange: boolean) => {
      const typeAddresses = Object.keys(addressEntries).filter(
        (addressEntry) => addressEntries[addressEntry].isChange === isChange
      );

      const lastActiveIndex = isChange ? lastActiveIndexes.change : lastActiveIndexes.receive;

      const limitDiff = typeAddresses.length - GAP_LIMIT;

      if (limitDiff < 0) {
        return;
      }

      const missingAddressesCount = lastActiveIndex + 1 - limitDiff;

      if (missingAddressesCount <= 0) {
        return;
      }

      getAddressEntriesHistory(
        addressService.deriveAddressRange(isChange, typeAddresses.length, missingAddressesCount)
      );
    },
    [addressEntries, getAddressEntriesHistory, lastActiveIndexes, addressService]
  );

  useEffect(() => {
    electrumService.on("open", handleElectrumConnect);
    electrumService.on("message", handleElectrumMessage);
  }, [handleElectrumConnect, handleElectrumMessage]);

  useEffect(() => {
    getAdditionalAddressEntries(false);
    getAdditionalAddressEntries(true);
  }, [getAdditionalAddressEntries]);

  useEffect(() => {
    setAddressEntries({});
    setLastActiveIndexes(LAST_ACTIVE_INDEXES_DEFAULT);
  }, [xpub, scriptType]);

  return useMemo(() => addressEntries, [addressEntries]);
};
