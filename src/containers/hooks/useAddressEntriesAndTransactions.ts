import { useCallback, useEffect, useMemo, useState } from "react";
import { AddressService } from "../../AddressService";
import { GAP_LIMIT, GET_HISTORY, GET_TRANSACTION } from "../../constants";
import { electrumService } from "../../ElectrumService";
import { AddressEntry, HistoryItem, ScriptType, Transaction } from "../../types";

const LAST_ACTIVE_INDEXES_DEFAULT = { receive: 0, change: 0 };

export const useAddressEntriesAndTransactions = (xpub: string, scriptType: ScriptType) => {
  const addressService = useMemo(() => new AddressService(xpub, scriptType), [xpub, scriptType]);

  const initialAddressEntries = useMemo(
    () => [...addressService.deriveAddressRange(false), ...addressService.deriveAddressRange(true)],
    [addressService]
  );

  const [addressesToLoad, setAddressesToLoad] = useState<string[]>(
    initialAddressEntries.map((addressEntry) => addressEntry.address)
  );

  const [addressEntries, setAddressEntries] = useState<Record<string, AddressEntry>>({});
  const [transactions, setTransactions] = useState<Record<string, Transaction>>({});
  const [lastActiveIndexes, setLastActiveIndexes] = useState(LAST_ACTIVE_INDEXES_DEFAULT);

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

  const handleElectrumConnect = useCallback(() => {
    getAddressEntriesHistory(initialAddressEntries);
  }, [initialAddressEntries, getAddressEntriesHistory]);

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

        setAddressEntries((prev) => {
          const addressEntryToUpdate = Object.values(prev).find((a) => a.scriptHash === scriptHash)!;

          setAddressesToLoad((prev) => prev.filter((address) => address !== addressEntryToUpdate.address));

          return {
            ...prev,
            [addressEntryToUpdate.address]: {
              ...addressEntryToUpdate,
              transactionIds: historyItems.map((item) => item.tx_hash),
            },
          };
        });

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
        const transaction = result as Transaction;

        setTransactions((prev) => {
          if (prev[transaction.txid]) {
            console.log(`tx ${transaction.txid} was already loaded`);
          }

          return {
            ...prev,
            [transaction.txid]: transaction,
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
      const addressEntriesByType = Object.keys(addressEntries).filter(
        (addressEntry) => addressEntries[addressEntry].isChange === isChange
      );

      const lastActiveIndex = isChange ? lastActiveIndexes.change : lastActiveIndexes.receive;

      const limitDiff = addressEntriesByType.length - GAP_LIMIT;

      if (limitDiff < 0) {
        return;
      }

      const missingAddressesCount = lastActiveIndex + 1 - limitDiff;

      if (missingAddressesCount <= 0) {
        return;
      }

      const derivedAddressEntries = addressService.deriveAddressRange(
        isChange,
        addressEntriesByType.length,
        missingAddressesCount
      );

      setAddressesToLoad(derivedAddressEntries.map((addressEntry) => addressEntry.address));

      getAddressEntriesHistory(derivedAddressEntries);
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

  const addressesLoaded = useMemo(() => addressesToLoad.length === 0, [addressesToLoad]);

  useEffect(() => {
    if (!addressesLoaded) {
      return;
    }

    const transactionIdsToLoad = new Set(
      Object.values(addressEntries).flatMap((addressEntry) => addressEntry.transactionIds)
    );

    for (const transactionId of transactionIdsToLoad) {
      electrumService.sendMessage({
        id: GET_TRANSACTION,
        method: GET_TRANSACTION,
        params: [transactionId, true],
      });
    }
  }, [addressesLoaded, addressEntries]);

  const transactionsLoaded = useMemo(
    () =>
      addressesLoaded &&
      Object.values(addressEntries)
        .flatMap((addressEntry) => addressEntry.transactionIds)
        .every((transactionId) => !!transactions[transactionId]),
    [addressesLoaded, addressEntries, transactions]
  );

  return useMemo(
    () => ({ addressEntries, transactions, isLoading: !addressesLoaded || !transactionsLoaded }),
    [addressEntries, transactions, addressesLoaded, transactionsLoaded]
  );
};
