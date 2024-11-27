import { Edge } from "@xyflow/react";
import { useCallback, useMemo } from "react";
import { Wallet } from "../../../contexts/WalletContext";
import {
  AddressEntry,
  Direction,
  AddressNode as IAddressNode,
  PositionlessNode,
  Transaction,
  XpubNode as XpubNodeType,
} from "../../../types";

// todo: optimize performance a bit

export const useNodesAndEdges = (direction: Direction) => {
  const getSpendingTransactionIds = useCallback(
    (addressEntry: AddressEntry, transactions: Record<string, Transaction>) =>
      addressEntry.transactionIds.filter((transactionId) =>
        transactions[transactionId].vin.some((vin) =>
          addressEntry.transactionIds.some((txId) =>
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
      nodes: PositionlessNode[],
      edges: Edge[],
      currentLevelAddressEntries: AddressEntry[],
      addressEntries: Record<string, AddressEntry>,
      transactions: Record<string, Transaction>
    ) => {
      if (currentLevelAddressEntries.length === 0) {
        return;
      }

      const nextLevelAddressEntries: AddressEntry[] = [];

      for (const addressEntry of currentLevelAddressEntries) {
        const spendingTransactionIds = addressEntry.transactionIds.filter((transactionId) =>
          transactions[transactionId].vin.some((vin) =>
            addressEntry.transactionIds.some((txId) =>
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
                direction,
                spendingTransactionLength: nextLevelAddressEntry
                  ? getSpendingTransactionIds(nextLevelAddressEntry, transactions).length
                  : 0,
                type: nextLevelAddressEntry ? "changeAddress" : "externalAddress",
              },
              type: "addressNode",
            };

            const existingNode = nodes.find((existingNode) => existingNode.id === node.id);

            if (!existingNode) {
              nodes.push(node);
            }

            edges.push({
              id: `${addressEntry.address}-${node.id}`,
              source: addressEntry.address,
              target: node.id,
            });

            if (nextLevelAddressEntry && !existingNode) {
              nextLevelAddressEntries.push(nextLevelAddressEntry);
            }
          }
        }
      }

      populateAddressNodesAndEdges(nodes, edges, nextLevelAddressEntries, addressEntries, transactions);
    },
    [getSpendingTransactionIds, direction]
  );

  const getXpubAddressesNodesAndEdges = useCallback(
    (
      nodes: PositionlessNode[],
      edges: Edge[],
      xpubNode: PositionlessNode,
      addressEntries: Record<string, AddressEntry>,
      transactions: Record<string, Transaction>,
      adjacentAddressEntries: Record<string, AddressEntry>
    ) => {
      const xpubAddressEntries = Object.values(addressEntries).filter((addressEntry) => {
        const adjacentAddressEntry = adjacentAddressEntries[addressEntry.address];

        if (adjacentAddressEntry && adjacentAddressEntry.xpub === xpubNode.id) {
          edges.push({
            id: `${xpubNode.id}-${adjacentAddressEntry.address}`,
            source: xpubNode.id,
            target: adjacentAddressEntry.address,
            animated: true,
          });
        }

        return (
          addressEntry.xpub === xpubNode.id &&
          !addressEntry.isChange &&
          addressEntry.transactionIds.length > 0 &&
          // the following condition basically means 'funded externally'
          addressEntry.transactionIds.some((transactionId) =>
            transactions[transactionId].vin.some((vin) => !transactions[vin.txid])
          )
        );
      });

      for (const addressEntry of xpubAddressEntries) {
        const node: Omit<IAddressNode, "position"> = {
          id: addressEntry.address,
          data: {
            address: addressEntry.address,
            direction,
            spendingTransactionLength: getSpendingTransactionIds(addressEntry, transactions).length,
            type: "xpubAddress",
          },
          type: "addressNode",
        };

        nodes.push(node);

        edges.push({
          id: `${xpubNode.id}-${node.id}`,
          source: xpubNode.id,
          target: node.id,
        });
      }

      return xpubAddressEntries;
    },
    [getSpendingTransactionIds, direction]
  );

  const populateNodesAndEdges = useCallback(
    (
      wallet: Wallet,
      nodes: PositionlessNode[],
      edges: Edge[],
      addressEntries: Record<string, AddressEntry>,
      transactions: Record<string, Transaction>,
      adjacentAddressEntries: Record<string, AddressEntry>
    ) => {
      const xpub = wallet.hdKey.publicExtendedKey;

      const xpubNode: Omit<XpubNodeType, "position"> = {
        id: xpub,
        data: { xpub, direction },
        type: "xpubNode",
      };

      nodes.push(xpubNode);

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
    [getXpubAddressesNodesAndEdges, populateAddressNodesAndEdges, direction]
  );

  return useMemo(() => ({ populateNodesAndEdges }), [populateNodesAndEdges]);
};
