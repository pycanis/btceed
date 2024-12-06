import { useQuery } from "@tanstack/react-query";
import { MutableRefObject, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import useWebSocket, { Options } from "react-use-websocket";
import {
  GAP_LIMIT,
  GET_DB_XPUBS,
  GET_HISTORY,
  GET_TRANSACTION,
  SATS_IN_BTC,
  VITE_ELECTRUM_WS_SERVER_URL,
} from "../../../constants";
import { AddressEntry, HistoryItem, Transaction, Wallet } from "../../../types";
import { getWallet } from "../../../utils/wallet";
import { useDatabaseContext } from "../../DatabaseContext";
import { useAddressService } from "./useAddressService";

type XpubLastActiveIndexes = Record<string, { receive: number; change: number }>;

type State = {
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

type WalletsUpdatedAction = {
  type: "walletsUpdatedAction";
  payload: {
    wallets: Wallet[];
    deriveAddressRange: (wallet: Wallet, isChange: boolean, startIndex?: number, limit?: number) => AddressEntry[];
    getAddressEntriesHistory: (addressEntries: AddressEntry[]) => void;
    previousAddressesLoaded: MutableRefObject<boolean>;
  };
};

type Action = GetHistoryAction | GetTransactionAction | GetAdditionalAddressEntriesAction | WalletsUpdatedAction;

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "getHistory": {
      const { scriptHash, historyItems, isChange, index } = action.payload;

      const addressEntryToUpdate = Object.values(state.addressEntries).find((a) => a.scriptHash === scriptHash)!;

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

      return { ...state, addressEntries };
    }

    case "walletsUpdatedAction": {
      const { wallets, deriveAddressRange, getAddressEntriesHistory, previousAddressesLoaded } = action.payload;

      const addedWallets = wallets.filter(
        (wallet) => !Object.keys(state.xpubLastActiveIndexes).some((xpub) => xpub === wallet.hdKey.publicExtendedKey)
      );

      if (addedWallets.length > 0) {
        const addressEntries = addedWallets.flatMap((wallet) => [
          ...deriveAddressRange(wallet, false),
          ...deriveAddressRange(wallet, true),
        ]);

        const xpubLastActiveIndexes = addedWallets.reduce((acc, wallet) => {
          acc[wallet.hdKey.publicExtendedKey] = { receive: 0, change: 0 };
          return acc;
        }, {} as XpubLastActiveIndexes);

        getAddressEntriesHistory(addressEntries);
        previousAddressesLoaded.current = false;

        return {
          ...state,
          addressEntries: {
            ...state.addressEntries,
            ...addressEntries.reduce((acc, addressEntry) => {
              acc[addressEntry.address] = addressEntry;

              return acc;
            }, {} as Record<string, AddressEntry>),
          },
          xpubLastActiveIndexes: { ...state.xpubLastActiveIndexes, ...xpubLastActiveIndexes },
        };
      }

      const removedXpubs = Object.keys(state.xpubLastActiveIndexes).filter(
        (xpub) => !wallets.some((wallet) => wallet.hdKey.publicExtendedKey === xpub)
      );

      const addressEntriesCopy = { ...state.addressEntries };
      const xpubLastActiveIndexesCopy = { ...state.xpubLastActiveIndexes };

      Object.values(state.addressEntries).forEach((addressEntry) => {
        if (removedXpubs.includes(addressEntry.xpub)) {
          delete addressEntriesCopy[addressEntry.address];
        }
      });

      Object.keys(state.xpubLastActiveIndexes).forEach((xpub) => {
        if (removedXpubs.includes(xpub)) {
          delete xpubLastActiveIndexesCopy[xpub];
        }
      });

      return { ...state, addressEntries: addressEntriesCopy, xpubLastActiveIndexes: xpubLastActiveIndexesCopy };
    }

    default:
      throw new Error("Unknown action.");
  }
};

export const useAddressEntriesAndTransactions = () => {
  const { db } = useDatabaseContext();
  const { deriveAddressRange } = useAddressService();

  const { data: xpubStoreValues = [] } = useQuery({
    queryKey: [GET_DB_XPUBS],
    queryFn: () => db.getAllFromIndex("xpubs", "createdAt"),
  });

  const wallets = useMemo(() => xpubStoreValues.map(getWallet), [xpubStoreValues]);

  const [state, dispatch] = useReducer(reducer, {
    addressEntries: {},
    xpubLastActiveIndexes: {},
    transactions: {},
  } as State);

  const previousAddressesLoaded = useRef(false);
  const [initialTransactionsLoaded, setInitialTransactionsLoaded] = useState(false);

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
      onOpen: () => console.log("Connected to Electrum server."),
      onClose: () => console.log("Connection to Electrum server stopped."),
      onError: (e) => console.error("Electrum server connection error.", e),
      onMessage: handleElectrumMessage,
    }),
    [handleElectrumMessage]
  );

  const { sendJsonMessage } = useWebSocket(VITE_ELECTRUM_WS_SERVER_URL, electrumWsOptions);

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

        if (!xpubLastActiveIndex) {
          continue;
        }

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
    dispatch({
      type: "walletsUpdatedAction",
      payload: { wallets, deriveAddressRange, getAddressEntriesHistory, previousAddressesLoaded },
    });
  }, [wallets, deriveAddressRange, getAddressEntriesHistory]);

  useEffect(() => {
    getAdditionalAddressEntries(false);
    getAdditionalAddressEntries(true);
  }, [getAdditionalAddressEntries]);

  const addressesLoaded = useMemo(
    () => Object.values(state.addressEntries).every((addressEntry) => !!addressEntry.transactionIds),
    [state]
  );

  useEffect(() => {
    if (!addressesLoaded || previousAddressesLoaded.current) {
      return;
    }

    previousAddressesLoaded.current = true;
    setInitialTransactionsLoaded(true);

    const transactionIdsToLoad = new Set(
      Object.values(state.addressEntries)
        .flatMap((addressEntry) => addressEntry.transactionIds)
        .filter((transactionId) => !state.transactions[transactionId!])
    );

    for (const transactionId of transactionIdsToLoad) {
      sendJsonMessage({
        id: GET_TRANSACTION,
        method: GET_TRANSACTION,
        params: [transactionId, true],
      });
    }
  }, [sendJsonMessage, addressesLoaded, state]);

  const transactionsLoaded = useMemo(
    () =>
      addressesLoaded &&
      Object.values(state.addressEntries)
        .flatMap((addressEntry) => addressEntry.transactionIds)
        .every((transactionId) => !!state.transactions[transactionId!]),
    [addressesLoaded, state]
  );

  const calculateTransactionFeeInSats = useCallback(
    (transaction: Transaction) => {
      const inputsValue = transaction.vin
        .flatMap((vin) =>
          state.transactions[vin.txid].vout
            .filter((vout) => {
              const addressEntry = state.addressEntries[vout.scriptPubKey.address];

              return addressEntry && vout.n === vin.vout;
            })
            .map((vout) => vout.value)
        )
        .reduce((sum, value) => sum + Math.round(value * SATS_IN_BTC), 0);

      const outputsValue = transaction.vout.reduce((sum, vout) => sum + Math.round(vout.value * SATS_IN_BTC), 0);

      return inputsValue - outputsValue;
    },
    [state]
  );

  return useMemo(
    () => ({
      addressEntries: state.addressEntries,
      transactions: state.transactions,
      calculateTransactionFeeInSats,
      isLoading: !addressesLoaded || !transactionsLoaded || !initialTransactionsLoaded,
    }),
    [state, addressesLoaded, transactionsLoaded, initialTransactionsLoaded, calculateTransactionFeeInSats]
  );
};
