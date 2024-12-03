import { Edge } from "@xyflow/react";
import { useCallback, useMemo } from "react";
import {
  AddressEntry,
  AddressNode as IAddressNode,
  PositionlessNode,
  Transaction,
  Wallet,
  XpubNode as XpubNodeType,
} from "../../../types";

// TODO: there might be some slight performance optimizations

export const useNodesAndEdges = () => {
  const populateAddressNodesAndEdges = useCallback(
    (
      wallet: Wallet,
      nodes: Record<string, PositionlessNode>,
      edges: Record<string, Edge>,
      currentLevelAddressEntries: AddressEntry[],
      addressEntries: Record<string, AddressEntry>,
      transactions: Record<string, Transaction>
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
                  : [],
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

      populateAddressNodesAndEdges(wallet, nodes, edges, nextLevelAddressEntries, addressEntries, transactions);
    },
    []
  );

  const getXpubAddressesNodesAndEdges = useCallback(
    (
      wallet: Wallet,
      nodes: Record<string, PositionlessNode>,
      edges: Record<string, Edge>,
      xpubNode: Omit<XpubNodeType, "position">,
      addressEntries: Record<string, AddressEntry>,
      transactions: Record<string, Transaction>,
      adjacentAddressEntries: Record<string, AddressEntry>
    ) => {
      const xpubAddressEntries = Object.values(addressEntries).filter(
        (addressEntry) => addressEntry.xpub === xpubNode.id && !addressEntry.isChange
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
    []
  );

  const populateNodesAndEdges = useCallback(
    (
      wallet: Wallet,
      nodes: Record<string, PositionlessNode>,
      edges: Record<string, Edge>,
      addressEntries: Record<string, AddressEntry>,
      transactions: Record<string, Transaction>,
      adjacentAddressEntries: Record<string, AddressEntry>
    ) => {
      const xpub = wallet.hdKey.publicExtendedKey;

      // const {} = Object.values(addressEntries).reduce((totals, addressEntry) => {
      //   if (addressEntry.xpub !== wallet.hdKey.publicExtendedKey) {
      //     return totals
      //   }

      //   for (const transactionId of addressEntry.transactionIds!) {
      //     const transaction = transactions[transactionId]

      //     const received = transaction.vin.filter(vin => vin.)
      //   }

      //   return totals
      // }, {totalSpent: 0, totalReceived: 0, transactionsCount: 0})

      const xpubNode: Omit<XpubNodeType, "position"> = {
        id: xpub,
        data: { wallet },
        type: "xpubNode",
      };

      nodes[xpubNode.id] = xpubNode;

      const xpubAddressEntries = getXpubAddressesNodesAndEdges(
        wallet,
        nodes,
        edges,
        xpubNode,
        addressEntries,
        transactions,
        adjacentAddressEntries
      );

      populateAddressNodesAndEdges(wallet, nodes, edges, xpubAddressEntries, addressEntries, transactions);
    },
    [getXpubAddressesNodesAndEdges, populateAddressNodesAndEdges]
  );

  return useMemo(() => ({ populateNodesAndEdges }), [populateNodesAndEdges]);
};
