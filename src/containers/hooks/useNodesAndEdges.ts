import dagre from "@dagrejs/dagre";
import { Edge } from "@xyflow/react";
import { useCallback, useMemo } from "react";
import { NODE_HEIGHT, NODE_WIDTH } from "../../constants";
import {
  AddressEntry,
  Direction,
  AddressNode as IAddressNode,
  PositionlessNode,
  ScriptType,
  XpubNode as XpubNodeType,
} from "../../types";
import { useAddressEntriesAndTransactions } from "./useAddressEntriesAndTransactions";

const xpub = "";

const scriptType: ScriptType = "p2wpkh";

export const useNodesAndEdges = (direction: Direction) => {
  const { addressEntries, transactions, isLoading } = useAddressEntriesAndTransactions(xpub, scriptType);

  const dagreGraph = useMemo(() => new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({})), []);

  const getLayoutedNodesAndEdges = useCallback(
    (nodes: PositionlessNode[], edges: Edge[], direction: Direction) => {
      dagreGraph.setGraph({ rankdir: direction });

      nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
      });

      edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
      });

      dagre.layout(dagreGraph);

      const newNodes = nodes.map((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);

        const newNode = {
          ...node,
          position: {
            x: nodeWithPosition.x - NODE_WIDTH / 2,
            y: nodeWithPosition.y - NODE_HEIGHT / 2,
          },
        };

        return newNode;
      });

      return { nodes: newNodes, edges };
    },
    [dagreGraph]
  );

  const populateAddressNodesAndEdges = useCallback(
    (nodes: PositionlessNode[], edges: Edge[], currentLevelAddressEntries: AddressEntry[]) => {
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

            const nextLevelAddressEntry = addressEntries[address];

            const node: Omit<IAddressNode, "position"> = {
              id: address,
              data: {
                ...(nextLevelAddressEntry || { address, transactions: [] }),
                direction,
                type: nextLevelAddressEntry ? "changeAddress" : "externalAddress",
              },
              type: "addressNode",
            };

            nodes.push(node);

            edges.push({
              id: `${addressEntry.address}-${node.id}`,
              source: addressEntry.address,
              target: node.id,
            });

            if (nextLevelAddressEntry) {
              nextLevelAddressEntries.push(nextLevelAddressEntry);
            }
          }
        }
      }

      populateAddressNodesAndEdges(nodes, edges, nextLevelAddressEntries);
    },
    [addressEntries, transactions, direction]
  );

  const getXpubAddressesNodesAndEdges = useCallback(
    (nodes: PositionlessNode[], edges: Edge[], xpubNode: Omit<XpubNodeType, "position">) => {
      const xpubAddressEntries = Object.values(addressEntries).filter(
        (a) => !a.isChange && a.transactionIds.length > 0
      );

      for (const addressEntry of xpubAddressEntries) {
        const node: Omit<IAddressNode, "position"> = {
          id: addressEntry.address,
          data: { ...addressEntry, direction, type: "xpubAddress" },
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
    [addressEntries, direction]
  );

  const getNodesAndEdges = useCallback(() => {
    const nodes: PositionlessNode[] = [];
    const edges: Edge[] = [];

    const xpubNode: Omit<XpubNodeType, "position"> = {
      id: xpub,
      data: { xpub, direction },
      type: "xpubNode",
    };

    nodes.push(xpubNode);

    const xpubAddressEntries = getXpubAddressesNodesAndEdges(nodes, edges, xpubNode);

    populateAddressNodesAndEdges(nodes, edges, xpubAddressEntries);

    return getLayoutedNodesAndEdges(nodes, edges, direction);
  }, [getLayoutedNodesAndEdges, getXpubAddressesNodesAndEdges, populateAddressNodesAndEdges, direction]);

  return useMemo(() => (isLoading ? { nodes: [], edges: [] } : getNodesAndEdges()), [getNodesAndEdges, isLoading]);
};
