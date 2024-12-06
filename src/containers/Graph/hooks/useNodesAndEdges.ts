import { Edge } from "@xyflow/react";
import { useCallback, useMemo } from "react";
import { SATS_IN_BTC } from "../../../constants";
import { useGraphContext } from "../../../contexts/GraphContext/GraphContext";
import { useSettingsContext } from "../../../contexts/SettingsContext";
import {
  AddressEntry,
  AddressNode as IAddressNode,
  PositionlessNode,
  Wallet,
  XpubNode as XpubNodeType,
} from "../../../types";

// TODO: there might be some slight performance optimizations

export const useNodesAndEdges = () => {
  const { settings } = useSettingsContext();

  const {
    addressEntriesAndTransactions: { transactions, addressEntries, calculateTransactionFeeInSats },
  } = useGraphContext();

  const populateAddressNodesAndEdges = useCallback(
    (
      wallet: Wallet,
      nodes: Record<string, PositionlessNode>,
      edges: Record<string, Edge>,
      currentLevelAddressEntries: AddressEntry[]
    ) => {
      if (currentLevelAddressEntries.length === 0) {
        return;
      }

      const nextLevelAddressEntries: AddressEntry[] = [];

      for (const addressEntry of currentLevelAddressEntries) {
        const spendingTransactionIds = addressEntry.transactionIds!.filter((transactionId) =>
          transactions[transactionId].vin.some((vin) =>
            addressEntry.transactionIds!.some((txId) =>
              transactions[txId].vout.some(
                (vout) =>
                  txId !== transactionId && vout.n === vin.vout && vout.scriptPubKey.address === addressEntry.address
              )
            )
          )
        );

        for (const transactionId of spendingTransactionIds) {
          for (const vout of transactions[transactionId].vout) {
            const address = vout.scriptPubKey.address;

            // handle case when tx output goes back to address it's coming from
            if (address === addressEntry.address) {
              continue;
            }

            const nextLevelAddressEntry = addressEntries[address] as AddressEntry | undefined;

            const node: Omit<IAddressNode, "position"> = {
              id: address,
              data: {
                address,
                isChange: nextLevelAddressEntry?.isChange,
                index: nextLevelAddressEntry?.index,
                transactions: nextLevelAddressEntry
                  ? nextLevelAddressEntry.transactionIds!.map((transactionId) => transactions[transactionId])
                  : [transactions[transactionId]],
                wallet,
                type: nextLevelAddressEntry ? "changeAddress" : "externalAddress",
              },
              type: "addressNode",
            };

            const existingNode = nodes[node.id];

            if (!existingNode) {
              nodes[node.id] = node;
            }

            const edge: Edge = {
              id: `${addressEntry.address}-${node.id}`,
              source: addressEntry.address,
              target: node.id,
              type: "customEdge",
            };

            const existingEdge = edges[edge.id];

            if (!existingEdge) {
              edges[edge.id] = edge;
            }

            if (nextLevelAddressEntry && !existingNode) {
              nextLevelAddressEntries.push(nextLevelAddressEntry);
            }
          }
        }
      }

      populateAddressNodesAndEdges(wallet, nodes, edges, nextLevelAddressEntries);
    },
    [transactions, addressEntries]
  );

  const getXpubAddressesNodesAndEdges = useCallback(
    (
      wallet: Wallet,
      nodes: Record<string, PositionlessNode>,
      edges: Record<string, Edge>,
      xpubNode: Omit<XpubNodeType, "position">,
      adjacentAddressEntries: Record<string, AddressEntry>
    ) => {
      const xpubAddressEntries = Object.values(addressEntries).filter(
        (addressEntry) =>
          addressEntry.xpub === xpubNode.id &&
          !addressEntry.isChange &&
          (settings.showAddressesWithoutTransactions || addressEntry.transactionIds!.length > 0)
      );

      for (const addressEntry of xpubAddressEntries) {
        const adjacentAddressEntry = adjacentAddressEntries[addressEntry.address];

        const addressEntryTransactions = addressEntry.transactionIds!.map(
          (transactionId) => transactions[transactionId]
        );

        const node: Omit<IAddressNode, "position"> = {
          id: addressEntry.address,
          data: {
            address: addressEntry.address,
            isChange: addressEntry.isChange,
            index: addressEntry.index,
            transactions: addressEntryTransactions,
            wallet,
            type: adjacentAddressEntry ? "changeAddress" : "xpubAddress",
          },
          type: "addressNode",
        };

        const edge: Edge = {
          id: `${xpubNode.id}-${node.id}`,
          source: xpubNode.id,
          target: node.id,
          animated: !!adjacentAddressEntry || addressEntryTransactions.length === 0,
          type: "customEdge",
        };

        if (!adjacentAddressEntry) {
          nodes[node.id] = node;
        }

        edges[edge.id] = edge;
      }

      return xpubAddressEntries;
    },
    [transactions, addressEntries, settings.showAddressesWithoutTransactions]
  );

  const populateNodesAndEdges = useCallback(
    (
      wallet: Wallet,
      nodes: Record<string, PositionlessNode>,
      edges: Record<string, Edge>,
      adjacentAddressEntries: Record<string, AddressEntry>
    ) => {
      const xpub = wallet.hdKey.publicExtendedKey;

      const xpubTransactionIds = new Set(
        Object.values(addressEntries)
          .filter((addressEntry) => addressEntry.xpub === xpub)
          .flatMap((addressEntry) => addressEntry.transactionIds!)
      );

      const totals = Array.from(xpubTransactionIds).reduce(
        (totals, transactionId) => {
          let received = 0;
          let spent = 0;
          let fee = 0;

          const transaction = transactions[transactionId];

          const isSpendingTransaction = transaction.vin.some((vin) =>
            transactions[vin.txid]?.vout.some((vout) => {
              const addressEntry = addressEntries[vout.scriptPubKey.address];

              return addressEntry && addressEntry.xpub === xpub && vout.n === vin.vout;
            })
          );

          if (isSpendingTransaction) {
            spent = transaction.vout.reduce((sum, vout) => {
              const addressEntry = addressEntries[vout.scriptPubKey.address];

              return addressEntry && addressEntry.xpub === xpub ? sum : sum + Math.round(vout.value * SATS_IN_BTC);
            }, 0);

            fee = calculateTransactionFeeInSats(transaction);
          } else {
            received = transaction.vout.reduce((sum, vout) => {
              const addressEntry = addressEntries[vout.scriptPubKey.address];

              return addressEntry && addressEntry.xpub === xpub ? sum + Math.round(vout.value * SATS_IN_BTC) : sum;
            }, 0);
          }

          return {
            totalSpent: totals.totalSpent + spent,
            totalReceived: totals.totalReceived + received,
            totalFee: totals.totalFee + fee,
            transactionsCount: totals.transactionsCount + 1,
          };
        },
        { totalSpent: 0, totalReceived: 0, totalFee: 0, transactionsCount: 0 }
      );

      const xpubNode: Omit<XpubNodeType, "position"> = {
        id: xpub,
        data: { wallet, totals },
        type: "xpubNode",
      };

      nodes[xpubNode.id] = xpubNode;

      const xpubAddressEntries = getXpubAddressesNodesAndEdges(wallet, nodes, edges, xpubNode, adjacentAddressEntries);

      populateAddressNodesAndEdges(wallet, nodes, edges, xpubAddressEntries);
    },
    [
      getXpubAddressesNodesAndEdges,
      populateAddressNodesAndEdges,
      calculateTransactionFeeInSats,
      transactions,
      addressEntries,
    ]
  );

  return useMemo(() => ({ populateNodesAndEdges }), [populateNodesAndEdges]);
};
