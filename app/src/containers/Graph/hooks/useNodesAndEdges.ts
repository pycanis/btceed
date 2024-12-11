import { Edge } from "@xyflow/react";
import { useCallback, useMemo } from "react";
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
    addressEntriesAndTransactions: {
      transactions,
      addressEntries,
      adjacentAddressEntries,
      calculateTransactionFeeInSats,
      isSpendingTransaction,
      calculateTransactionSpentInSats,
      calculateTransactionReceivedInSats,
    },
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
      xpubNode: Omit<XpubNodeType, "position">
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
          animated: !!adjacentAddressEntry,
          type: "customEdge",
        };

        if (!adjacentAddressEntry) {
          nodes[node.id] = node;
        }

        edges[edge.id] = edge;
      }

      return xpubAddressEntries;
    },
    [transactions, addressEntries, settings.showAddressesWithoutTransactions, adjacentAddressEntries]
  );

  const populateNodesAndEdges = useCallback(
    (wallet: Wallet, nodes: Record<string, PositionlessNode>, edges: Record<string, Edge>) => {
      const xpub = wallet.xpub;

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

          if (isSpendingTransaction(transaction, xpub)) {
            spent = calculateTransactionSpentInSats(transaction, xpub);

            fee = calculateTransactionFeeInSats(transaction);
          } else {
            received = calculateTransactionReceivedInSats(transaction, xpub);
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

      const xpubAddressEntries = getXpubAddressesNodesAndEdges(wallet, nodes, edges, xpubNode);

      populateAddressNodesAndEdges(wallet, nodes, edges, xpubAddressEntries);
    },
    [
      getXpubAddressesNodesAndEdges,
      populateAddressNodesAndEdges,
      calculateTransactionFeeInSats,
      isSpendingTransaction,
      calculateTransactionSpentInSats,
      calculateTransactionReceivedInSats,
      transactions,
      addressEntries,
    ]
  );

  return useMemo(() => ({ populateNodesAndEdges }), [populateNodesAndEdges]);
};
