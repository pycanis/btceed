import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useReducer } from "react";
import useWebSocket, { Options } from "react-use-websocket";
import {
  GAP_LIMIT,
  GET_DB_WALLETS,
  GET_HISTORY,
  GET_TRANSACTION,
  SATS_IN_BTC,
  VITE_ELECTRUM_WS_SERVER_URL,
} from "../../../constants";
import { AddressEntry, HistoryItem, Transaction, Wallet } from "../../../types";
import { electrumResponseSchema } from "../../../validators";
import { useDatabaseContext } from "../../DatabaseContext";
import { useAddressService } from "./useAddressService";

type XpubLastActiveIndexes = Record<string, { receive: number; change: number }>;

type State = {
  wallets: Wallet[];
  addressEntries: Record<string, AddressEntry>;
  transactions: Record<string, Transaction>;
  xpubLastActiveIndexes: XpubLastActiveIndexes;
};

type GetHistoriesData = { id: string; result: HistoryItem[] };

type GetHistoryAction = {
  type: "getHistories";
  payload: {
    data: GetHistoriesData[];
    deriveAddressRange: (wallet: Wallet, isChange: boolean, startIndex?: number, limit?: number) => AddressEntry[];
  };
};

type GetTransactionAction = {
  type: "getTransactions";
  payload: { transactions: Transaction[] };
};

type WalletsUpdatedAction = {
  type: "walletsUpdated";
  payload: {
    wallets: Wallet[];
    deriveAddressRange: (wallet: Wallet, isChange: boolean, startIndex?: number, limit?: number) => AddressEntry[];
  };
};

type Action = GetHistoryAction | GetTransactionAction | WalletsUpdatedAction;

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "getHistories": {
      const { addressEntries, xpubLastActiveIndexes } = action.payload.data.reduce(
        (acc, { id, result }) => {
          const [_, scriptHash, indexParam, isChangeParam] = id.split("-");

          const addressEntryToUpdate = Object.values(acc.addressEntries).find((a) => a.scriptHash === scriptHash)!;

          const index = Number(indexParam);
          const isChange = isChangeParam === "true";

          acc.addressEntries[addressEntryToUpdate.address] = {
            ...addressEntryToUpdate,
            transactionIds: result.map((item) => item.tx_hash),
          };

          if (result.length > 0) {
            const indexesToUpdate = acc.xpubLastActiveIndexes[addressEntryToUpdate.xpub];

            acc.xpubLastActiveIndexes[addressEntryToUpdate.xpub] = {
              receive: !isChange && index > indexesToUpdate.receive ? index : indexesToUpdate.receive,
              change: isChange && index > indexesToUpdate.change ? index : indexesToUpdate.change,
            };
          }

          return acc;
        },
        { addressEntries: state.addressEntries, xpubLastActiveIndexes: state.xpubLastActiveIndexes }
      );

      const getAdditionalAddressEntries = (isChange: boolean) => {
        const additionalAddressEntries: AddressEntry[] = [];

        for (const wallet of state.wallets) {
          const addressEntriesByType = Object.values(state.addressEntries).filter(
            (addressEntry) => addressEntry.xpub === wallet.xpub && addressEntry.isChange === isChange
          );

          const xpubLastActiveIndex = state.xpubLastActiveIndexes[wallet.xpub];

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

          additionalAddressEntries.push(
            ...action.payload.deriveAddressRange(wallet, isChange, addressEntriesByType.length, missingAddressesCount)
          );
        }

        return additionalAddressEntries;
      };

      const additionalAddressEntries = [...getAdditionalAddressEntries(false), ...getAdditionalAddressEntries(true)];

      const addressEntriesWithAdditional = additionalAddressEntries.reduce((acc, addressEntry) => {
        acc[addressEntry.address] = addressEntry;

        return acc;
      }, addressEntries);

      return {
        ...state,
        addressEntries: addressEntriesWithAdditional,
        xpubLastActiveIndexes,
      };
    }

    case "getTransactions": {
      const { transactions } = action.payload;

      return {
        ...state,
        transactions: transactions.reduce((acc, transaction) => {
          acc[transaction.txid] = transaction;

          return acc;
        }, state.transactions),
      };
    }

    case "walletsUpdated": {
      const { wallets, deriveAddressRange } = action.payload;

      const addedWallets = wallets.filter(
        (wallet) => !Object.keys(state.xpubLastActiveIndexes).some((xpub) => xpub === wallet.xpub)
      );

      if (addedWallets.length > 0) {
        const addressEntries = addedWallets.flatMap((wallet) => [
          ...deriveAddressRange(wallet, false),
          ...deriveAddressRange(wallet, true),
        ]);

        const xpubLastActiveIndexes = addedWallets.reduce((acc, wallet) => {
          acc[wallet.xpub] = { receive: 0, change: 0 };
          return acc;
        }, {} as XpubLastActiveIndexes);

        return {
          ...state,
          wallets,
          addressEntries: {
            ...state.addressEntries,
            ...addressEntries.reduce((acc, addressEntry) => {
              acc[addressEntry.address] = addressEntry;

              return acc;
            }, {} as Record<string, AddressEntry>),
          },
          xpubLastActiveIndexes: {
            ...state.xpubLastActiveIndexes,
            ...xpubLastActiveIndexes,
          },
        };
      }

      const removedXpub = Object.keys(state.xpubLastActiveIndexes).find(
        (xpub) => !wallets.some((wallet) => wallet.xpub === xpub)
      );

      const addressEntriesCopy = { ...state.addressEntries };
      const transactionsCopy = { ...state.transactions };
      const xpubLastActiveIndexesCopy = { ...state.xpubLastActiveIndexes };

      Object.values(state.addressEntries).forEach((addressEntry) => {
        if (removedXpub === addressEntry.xpub) {
          delete addressEntriesCopy[addressEntry.address];
        }
      });

      Object.values(state.transactions).forEach((transaction) => {
        const shouldDeleteTransaction =
          transaction.vin.every((vin) => {
            const vinTransaction = state.transactions[vin.txid];

            if (!vinTransaction) {
              return true;
            }

            const vout = vinTransaction.vout.find((vout) => vout.n === vin.vout);

            if (!vout) {
              return true;
            }

            const addressEntry = addressEntriesCopy[vout.scriptPubKey.address];

            return !addressEntry;
          }) && transaction.vout.every((vout) => !addressEntriesCopy[vout.scriptPubKey.address]);

        if (shouldDeleteTransaction) {
          delete transactionsCopy[transaction.txid];
        }
      });

      Object.keys(state.xpubLastActiveIndexes).forEach((xpub) => {
        if (removedXpub === xpub) {
          delete xpubLastActiveIndexesCopy[xpub];
        }
      });

      return {
        wallets,
        addressEntries: addressEntriesCopy,
        transactions: transactionsCopy,
        xpubLastActiveIndexes: xpubLastActiveIndexesCopy,
      };
    }

    default:
      throw new Error("Unknown action.");
  }
};

export const useAddressEntriesAndTransactions = () => {
  const { db } = useDatabaseContext();
  const { deriveAddressRange } = useAddressService();

  const { data: wallets = [] } = useQuery({
    queryKey: [GET_DB_WALLETS],
    queryFn: () => db.getAllFromIndex("wallets", "createdAt"),
  });

  const [state, dispatch] = useReducer(reducer, {
    wallets: [],
    addressEntries: {},
    xpubLastActiveIndexes: {},
    transactions: {},
  });

  const handleElectrumMessage = useCallback(
    (event: WebSocketEventMap["message"]) => {
      const data = JSON.parse(event.data);

      const validData = electrumResponseSchema.parse(data);

      if (validData.length === 0) {
        return;
      }

      const [method] = validData[0].id.split("-");

      switch (method) {
        case GET_HISTORY: {
          dispatch({
            type: "getHistories",
            payload: { data: validData as GetHistoriesData[], deriveAddressRange },
          });

          break;
        }

        case GET_TRANSACTION: {
          dispatch({
            type: "getTransactions",
            payload: { transactions: validData.map((data) => data.result) as Transaction[] },
          });

          break;
        }

        default: {
          console.error("Unknown message.");
        }
      }
    },
    [deriveAddressRange]
  );

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
      const requestData = addressEntries.map((addressEntry) => ({
        id: `${GET_HISTORY}-${addressEntry.scriptHash}-${addressEntry.index}-${addressEntry.isChange}`,
        method: GET_HISTORY,
        params: [addressEntry.scriptHash],
      }));

      sendJsonMessage(requestData);
    },
    [sendJsonMessage]
  );

  useEffect(() => {
    dispatch({
      type: "walletsUpdated",
      payload: { wallets, deriveAddressRange },
    });
  }, [wallets, deriveAddressRange]);

  useEffect(() => {
    const addressEntriesWithoutHistoryData = Object.values(state.addressEntries).filter(
      (addressEntry) => !addressEntry.transactionIds
    );

    if (addressEntriesWithoutHistoryData.length === 0) {
      return;
    }

    getAddressEntriesHistory(addressEntriesWithoutHistoryData);
  }, [state, getAddressEntriesHistory]);

  const addressesLoaded = useMemo(() => {
    const addressEntries = Object.values(state.addressEntries);

    return addressEntries.length > 0 && addressEntries.every((addressEntry) => !!addressEntry.transactionIds);
  }, [state]);

  useEffect(() => {
    if (!addressesLoaded) {
      return;
    }

    const transactionIdsToLoad = new Set(
      Object.values(state.addressEntries)
        .flatMap((addressEntry) => addressEntry.transactionIds)
        .filter((transactionId) => !state.transactions[transactionId!])
    );

    if (transactionIdsToLoad.size === 0) {
      return;
    }

    const requestData = Array.from(transactionIdsToLoad).map((transactionId) => ({
      id: `${GET_TRANSACTION}-${transactionId}`,
      method: GET_TRANSACTION,
      params: [transactionId, true],
    }));

    sendJsonMessage(requestData);
  }, [sendJsonMessage, addressesLoaded, state]);

  const transactionsLoaded = useMemo(
    () =>
      addressesLoaded &&
      Object.values(state.addressEntries)
        .flatMap((addressEntry) => addressEntry.transactionIds)
        .every((transactionId) => !!state.transactions[transactionId!]),
    [addressesLoaded, state]
  );

  const adjacentAddressEntries = useMemo(
    () =>
      Object.values(state.addressEntries).reduce((acc, addressEntry) => {
        if (!addressEntry.transactionIds) {
          return acc;
        }

        addressEntry.transactionIds.some((transactionId) =>
          state.transactions[transactionId]?.vout.some((vout) => {
            const existingAddressEntry = state.addressEntries[vout.scriptPubKey.address];

            if (
              existingAddressEntry &&
              !existingAddressEntry.isChange &&
              existingAddressEntry.xpub !== addressEntry.xpub
            ) {
              acc[existingAddressEntry.address] = existingAddressEntry;
            }
          })
        );

        return acc;
      }, {} as Record<string, AddressEntry>),
    [state]
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

  const isSpendingTransaction = useCallback(
    (transaction: Transaction, xpub?: string) =>
      transaction.vin.some((vin) =>
        state.transactions[vin.txid]?.vout.some((vout) => {
          const addressEntry = state.addressEntries[vout.scriptPubKey.address];

          return addressEntry && (!xpub || addressEntry.xpub === xpub) && vout.n === vin.vout;
        })
      ),
    [state]
  );

  const calculateTransactionSpentInSats = useCallback(
    (transaction: Transaction, xpub?: string) =>
      transaction.vout.reduce((sum, vout) => {
        const addressEntry = state.addressEntries[vout.scriptPubKey.address];

        return addressEntry && (!xpub || addressEntry.xpub === xpub) ? sum : sum + Math.round(vout.value * SATS_IN_BTC);
      }, 0),
    [state]
  );

  const calculateTransactionReceivedInSats = useCallback(
    (transaction: Transaction, xpub?: string) =>
      transaction.vout.reduce((sum, vout) => {
        const addressEntry = state.addressEntries[vout.scriptPubKey.address];

        return addressEntry && (!xpub || addressEntry.xpub === xpub) ? sum + Math.round(vout.value * SATS_IN_BTC) : sum;
      }, 0),
    [state]
  );

  return useMemo(
    () => ({
      addressEntries: state.addressEntries,
      transactions: state.transactions,
      adjacentAddressEntries,
      calculateTransactionFeeInSats,
      isSpendingTransaction,
      calculateTransactionSpentInSats,
      calculateTransactionReceivedInSats,
      isLoading: !addressesLoaded || !transactionsLoaded,
    }),
    [
      state,
      addressesLoaded,
      transactionsLoaded,
      adjacentAddressEntries,
      calculateTransactionFeeInSats,
      isSpendingTransaction,
      calculateTransactionSpentInSats,
      calculateTransactionReceivedInSats,
    ]
  );
};
