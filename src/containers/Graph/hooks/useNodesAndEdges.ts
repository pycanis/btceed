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
  const getSpendingTransactionIds = useCallback(
    (addressEntry: AddressEntry, transactions: Record<string, Transaction>) =>
      addressEntry.transactionIds!.filter((transactionId) =>
        transactions[transactionId].vin.some((vin) =>
          addressEntry.transactionIds!.some((txId) =>
            transactions[txId].vout.some(
              (vout) =>
                txId !== transactionId && vout.n === vin.vout && vout.scriptPubKey.address === addressEntry.address
            )
          )
        )
      ),
    []
  );

  const populateAddressNodesAndEdges = useCallback(
    (
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
                spendingTransactionLength: nextLevelAddressEntry
                  ? getSpendingTransactionIds(nextLevelAddressEntry, transactions).length
                  : 0,
                type: nextLevelAddressEntry ? "changeAddress" : "externalAddress",
              },
              type: "addressNode",
            };

            const existingNode = nodes[node.id];

            if (!existingNode) {
              nodes[node.id] = node;
            }

            const edge = {
              id: `${addressEntry.address}-${node.id}`,
              source: addressEntry.address,
              target: node.id,
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

      populateAddressNodesAndEdges(nodes, edges, nextLevelAddressEntries, addressEntries, transactions);
    },
    [getSpendingTransactionIds]
  );

  const getXpubAddressesNodesAndEdges = useCallback(
    (
      nodes: Record<string, PositionlessNode>,
      edges: Record<string, Edge>,
      xpubNode: PositionlessNode,
      addressEntries: Record<string, AddressEntry>,
      transactions: Record<string, Transaction>,
      adjacentAddressEntries: Record<string, AddressEntry>
    ) => {
      const xpubAddressEntries = Object.values(addressEntries).filter(
        (addressEntry) => addressEntry.xpub === xpubNode.id && !addressEntry.isChange
      );

      for (const addressEntry of xpubAddressEntries) {
        const adjacentAddressEntry = adjacentAddressEntries[addressEntry.address];

        const node: Omit<IAddressNode, "position"> = {
          id: addressEntry.address,
          data: {
            address: addressEntry.address,
            spendingTransactionLength: getSpendingTransactionIds(addressEntry, transactions).length,
            type: adjacentAddressEntry ? "changeAddress" : "xpubAddress",
          },
          type: "addressNode",
        };

        const edge = {
          id: `${xpubNode.id}-${node.id}`,
          source: xpubNode.id,
          target: node.id,
          animated: !!adjacentAddressEntry,
        };

        if (!adjacentAddressEntry) {
          nodes[node.id] = node;
        }

        edges[edge.id] = edge;
      }

      return xpubAddressEntries;
    },
    [getSpendingTransactionIds]
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

      const xpubNode: Omit<XpubNodeType, "position"> = {
        id: xpub,
        data: { xpub },
        type: "xpubNode",
      };

      nodes[xpubNode.id] = xpubNode;

      const xpubAddressEntries = getXpubAddressesNodesAndEdges(
        nodes,
        edges,
        xpubNode,
        addressEntries,
        transactions,
        adjacentAddressEntries
      );

      populateAddressNodesAndEdges(nodes, edges, xpubAddressEntries, addressEntries, transactions);
    },
    [getXpubAddressesNodesAndEdges, populateAddressNodesAndEdges]
  );

  return useMemo(() => ({ populateNodesAndEdges }), [populateNodesAndEdges]);
};
