import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import useWebSocket, { Options } from "react-use-websocket";
import { GAP_LIMIT, GET_HISTORY, GET_TRANSACTION } from "../../../constants";
import { useElectrumContext } from "../../../contexts/ElectrumContext";
import { useWalletContext } from "../../../contexts/WalletContext";
import { AddressEntry, HistoryItem, Transaction } from "../../../types";
import { useAddressService } from "./useAddressService";

type XpubLastActiveIndexes = Record<string, { receive: number; change: number }>;

type State = {
  addressesToLoad: string[];
  addressEntries: Record<string, AddressEntry>;
  transactions: Record<string, Transaction>;
  xpubLastActiveIndexes: XpubLastActiveIndexes;
};

type GetHistoryAction = {
  type: "getHistory";
  payload: {
    scriptHash: string;
    historyItems: HistoryItem[];
    isChange: boolean;
    index: number;
  };
};

type GetTransactionAction = {
  type: "getTransaction";
  payload: { transaction: Transaction };
};

type GetAdditionalAddressEntriesAction = {
  type: "getAdditionalAddressEntries";
  payload: { additionalAddressEntries: AddressEntry[] };
};

type Action = GetHistoryAction | GetTransactionAction | GetAdditionalAddressEntriesAction;

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "getHistory": {
      const { scriptHash, historyItems, isChange, index } = action.payload;

      const addressEntryToUpdate = Object.values(state.addressEntries).find((a) => a.scriptHash === scriptHash)!;

      const addressesToLoad = state.addressesToLoad.filter((address) => address !== addressEntryToUpdate.address);

      const addressEntries = {
        ...state.addressEntries,
        [addressEntryToUpdate.address]: {
          ...addressEntryToUpdate,
          transactionIds: historyItems.map((item) => item.tx_hash),
        },
      };

      let xpubLastActiveIndexes = state.xpubLastActiveIndexes;

      if (historyItems.length > 0) {
        const indexesToUpdate = xpubLastActiveIndexes[addressEntryToUpdate.xpub];

        xpubLastActiveIndexes = {
          ...xpubLastActiveIndexes,
          [addressEntryToUpdate.xpub]: {
            receive: !isChange && index > indexesToUpdate.receive ? index : indexesToUpdate.receive,
            change: isChange && index > indexesToUpdate.change ? index : indexesToUpdate.change,
          },
        };
      }

      return {
        ...state,
        addressesToLoad,
        addressEntries,
        xpubLastActiveIndexes,
      };
    }

    case "getTransaction": {
      const { transaction } = action.payload;

      const transactions = {
        ...state.transactions,
        [transaction.txid]: transaction,
      };

      return {
        ...state,
        transactions,
      };
    }

    case "getAdditionalAddressEntries": {
      const { additionalAddressEntries } = action.payload;

      const addressEntries = additionalAddressEntries.reduce((acc, address) => {
        acc[address.address] = address;

        return acc;
      }, state.addressEntries);

      const addressesToLoad = [
        ...state.addressesToLoad,
        ...additionalAddressEntries.map((addressEntry) => addressEntry.address),
      ];

      return { ...state, addressEntries, addressesToLoad };
    }

    default:
      throw new Error("Unknown action.");
  }
};

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

  const initialState: State = useMemo(
    () => ({
      addressesToLoad: initialAddressEntries.map((addressEntry) => addressEntry.address),
      addressEntries: initialAddressEntries.reduce((acc, addressEntry) => {
        acc[addressEntry.address] = addressEntry;

        return acc;
      }, {} as Record<string, AddressEntry>),
      xpubLastActiveIndexes: initialXpubLastActiveIndexes,
      transactions: {},
    }),
    [initialAddressEntries, initialXpubLastActiveIndexes]
  );

  const [state, dispatch] = useReducer(reducer, initialState);
  const [transactionsLoadTriggered, setTransactionsLoadTriggered] = useState(false);

  const handleElectrumMessage = useCallback((event: WebSocketEventMap["message"]) => {
    const { id, result } = JSON.parse(event.data) as { id: string; result: unknown };

    if (!id) {
      return;
    }

    const [method, ...params] = id.split("-");

    switch (method) {
      case GET_HISTORY: {
        const [scriptHash, indexParam, isChangeParam] = params;

        const historyItems = result as HistoryItem[];

        dispatch({
          type: "getHistory",
          payload: {
            scriptHash,
            historyItems,
            isChange: isChangeParam === "true",
            index: Number(indexParam),
          },
        });

        break;
      }

      case GET_TRANSACTION: {
        const transaction = result as Transaction;

        dispatch({ type: "getTransaction", payload: { transaction } });

        break;
      }

      default: {
        console.error("Unknown message.");
      }
    }
  }, []);

  const electrumWsOptions = useMemo<Options>(
    () => ({
      share: true,
      shouldReconnect: () => true,
      filter: () => false,
      onMessage: handleElectrumMessage,
    }),
    [handleElectrumMessage]
  );

  const { sendJsonMessage } = useWebSocket(electrumUrl, electrumWsOptions);

  const getAddressEntriesHistory = useCallback(
    (addressEntries: AddressEntry[]) => {
      for (const addressEntry of addressEntries) {
        sendJsonMessage({
          id: `${GET_HISTORY}-${addressEntry.scriptHash}-${addressEntry.index}-${addressEntry.isChange}`,
          method: GET_HISTORY,
          params: [addressEntry.scriptHash],
        });
      }
    },
    [sendJsonMessage]
  );

  const getAdditionalAddressEntries = useCallback(
    (isChange: boolean) => {
      for (const wallet of wallets) {
        const xpub = wallet.hdKey.publicExtendedKey;

        const addressEntriesByType = Object.values(state.addressEntries).filter(
          (addressEntry) => addressEntry.xpub === xpub && addressEntry.isChange === isChange
        );

        const xpubLastActiveIndex = state.xpubLastActiveIndexes[xpub];

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

        dispatch({ type: "getAdditionalAddressEntries", payload: { additionalAddressEntries: derivedAddressEntries } });

        getAddressEntriesHistory(derivedAddressEntries);
      }
    },
    [state, deriveAddressRange, getAddressEntriesHistory, wallets]
  );

  useEffect(() => {
    getAddressEntriesHistory(initialAddressEntries);
  }, [getAddressEntriesHistory, initialAddressEntries]);

  useEffect(() => {
    getAdditionalAddressEntries(false);
    getAdditionalAddressEntries(true);
  }, [getAdditionalAddressEntries]);

  const addressesLoaded = useMemo(() => state.addressesToLoad.length === 0, [state]);

  useEffect(() => {
    if (!addressesLoaded || transactionsLoadTriggered) {
      return;
    }

    setTransactionsLoadTriggered(true);

    const transactionIdsToLoad = new Set(
      Object.values(state.addressEntries)
        .flatMap((addressEntry) => addressEntry.transactionIds)
        .filter((transactionId) => !state.transactions[transactionId])
    );

    for (const transactionId of transactionIdsToLoad) {
      sendJsonMessage({
        id: GET_TRANSACTION,
        method: GET_TRANSACTION,
        params: [transactionId, true],
      });
    }
  }, [sendJsonMessage, addressesLoaded, state, transactionsLoadTriggered]);

  const transactionsLoaded = useMemo(
    () =>
      addressesLoaded &&
      Object.values(state.addressEntries)
        .flatMap((addressEntry) => addressEntry.transactionIds)
        .every((transactionId) => !!state.transactions[transactionId]),
    [addressesLoaded, state]
  );

  return useMemo(
    () => ({
      addressEntries: state.addressEntries,
      transactions: state.transactions,
      isLoading: !addressesLoaded || !transactionsLoaded,
    }),
    [state, addressesLoaded, transactionsLoaded]
  );
};
