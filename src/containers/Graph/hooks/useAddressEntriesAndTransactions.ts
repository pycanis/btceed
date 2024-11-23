import { useCallback, useEffect, useMemo, useState } from "react";
import useWebSocket, { Options } from "react-use-websocket";
import { GAP_LIMIT, GET_HISTORY, GET_TRANSACTION } from "../../../constants";
import { useElectrumContext } from "../../../contexts/ElectrumContext";
import { useWalletContext } from "../../../contexts/WalletContext";
import { AddressEntry, HistoryItem, Transaction } from "../../../types";
import { useAddressService } from "./useAddressService";

type XpubLastActiveIndexes = Record<string, { receive: number; change: number }>;

export const useAddressEntriesAndTransactions = () => {
  const { electrumUrl } = useElectrumContext();
  const { wallets } = useWalletContext();

  const { deriveAddressRange } = useAddressService();

  const initialAddressEntries = useMemo(
    () => wallets.flatMap((wallet) => [...deriveAddressRange(wallet, false), ...deriveAddressRange(wallet, true)]),
    [deriveAddressRange, wallets]
  );

  const initialXpubLastActiveIndexes = useMemo(
    () =>
      wallets.reduce((acc, wallet) => {
        acc[wallet.hdKey.publicExtendedKey] = { receive: 0, change: 0 };
        return acc;
      }, {} as XpubLastActiveIndexes),
    [wallets]
  );

  const [addressesToLoad, setAddressesToLoad] = useState<string[]>(
    initialAddressEntries.map((addressEntry) => addressEntry.address)
  );

  const [addressEntries, setAddressEntries] = useState<Record<string, AddressEntry>>({});
  const [transactions, setTransactions] = useState<Record<string, Transaction>>({});
  const [xpubLastActiveIndexes, setXpubLastActiveIndexes] = useState(initialXpubLastActiveIndexes);

  const handleElectrumMessage = useCallback((event: WebSocketEventMap["message"]) => {
    const { id, result } = event.data as { id: string; result: unknown };

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

          if (historyItems.length > 0) {
            const isChange = isChangeParam === "true";
            const index = Number(indexParam);

            setXpubLastActiveIndexes((prevIndexes) => {
              const indexesToUpdate = prevIndexes[addressEntryToUpdate.xpub];

              return {
                ...prevIndexes,
                [addressEntryToUpdate.xpub]: {
                  receive: !isChange && index > indexesToUpdate.receive ? index : indexesToUpdate.receive,
                  change: isChange && index > indexesToUpdate.change ? index : indexesToUpdate.change,
                },
              };
            });
          }

          return {
            ...prev,
            [addressEntryToUpdate.address]: {
              ...addressEntryToUpdate,
              transactionIds: historyItems.map((item) => item.tx_hash),
            },
          };
        });

        break;
      }

      case GET_TRANSACTION: {
        const transaction = result as Transaction;

        setTransactions((prev) => ({
          ...prev,
          [transaction.txid]: transaction,
        }));

        break;
      }

      default: {
        console.log("Unknown message.");
      }
    }
  }, []);

  const electrumWsOptions = useMemo<Options>(
    () => ({
      //  share: true,
      //  shouldReconnect: () => true,
      onMessage: handleElectrumMessage,
    }),
    [handleElectrumMessage]
  );

  const electrumWs = useWebSocket(electrumUrl, electrumWsOptions);

  const getAddressEntriesHistory = useCallback(
    (addressEntries: AddressEntry[]) => {
      const addressEntry = addressEntries.reduce((acc, address) => {
        acc[address.address] = address;

        return acc;
      }, {} as Record<string, AddressEntry>);

      setAddressEntries((prev) => ({ ...prev, ...addressEntry }));

      for (const addressEntry of addressEntries) {
        electrumWs.sendJsonMessage({
          id: `${GET_HISTORY}-${addressEntry.scriptHash}-${addressEntry.index}-${addressEntry.isChange}`,
          method: GET_HISTORY,
          params: [addressEntry.scriptHash],
        });
      }
    },
    [electrumWs]
  );

  const getAdditionalAddressEntries = useCallback(
    (isChange: boolean) => {
      for (const wallet of wallets) {
        const xpub = wallet.hdKey.publicExtendedKey;
        const addressEntriesByType = Object.keys(addressEntries).filter(
          (addressEntry) =>
            addressEntries[addressEntry].xpub === xpub && addressEntries[addressEntry].isChange === isChange
        );

        const xpubLastActiveIndex = xpubLastActiveIndexes[xpub];

        const lastActiveIndex = isChange ? xpubLastActiveIndex.change : xpubLastActiveIndex.receive;

        const limitDiff = addressEntriesByType.length - GAP_LIMIT;

        if (limitDiff < 0) {
          continue;
        }

        const missingAddressesCount = lastActiveIndex + 1 - limitDiff;

        if (missingAddressesCount <= 0) {
          continue;
        }

        const derivedAddressEntries = deriveAddressRange(
          wallet,
          isChange,
          addressEntriesByType.length,
          missingAddressesCount
        );

        setAddressesToLoad((prev) => [...prev, ...derivedAddressEntries.map((addressEntry) => addressEntry.address)]);

        getAddressEntriesHistory(derivedAddressEntries);
      }
    },
    [addressEntries, getAddressEntriesHistory, xpubLastActiveIndexes, deriveAddressRange, wallets]
  );

  useEffect(() => {
    getAddressEntriesHistory(initialAddressEntries);
  }, [getAddressEntriesHistory, initialAddressEntries]);

  useEffect(() => {
    getAdditionalAddressEntries(false);
    getAdditionalAddressEntries(true);
  }, [getAdditionalAddressEntries]);

  const addressesLoaded = useMemo(() => addressesToLoad.length === 0, [addressesToLoad]);

  useEffect(() => {
    if (!addressesLoaded) {
      return;
    }

    const transactionIdsToLoad = new Set(
      Object.values(addressEntries).flatMap((addressEntry) => addressEntry.transactionIds)
    );

    for (const transactionId of transactionIdsToLoad) {
      electrumWs.sendJsonMessage({
        id: GET_TRANSACTION,
        method: GET_TRANSACTION,
        params: [transactionId, true],
      });
    }
  }, [addressesLoaded, addressEntries, electrumWs]);

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
