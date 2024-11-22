import dagre from "@dagrejs/dagre";
import { Edge, Node } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { NODE_HEIGHT, NODE_WIDTH } from "../../constants";
import {
  AddressEntry,
  Direction,
  AddressNode as IAddressNode,
  PositionlessNode,
  ScriptType,
  XpubNode as XpubNodeType,
} from "../../types";
import { useAddressEntries } from "./useAddressEntries";

const xpub = "";

const scriptType: ScriptType = "p2wpkh";

export const useNodesAndEdges = (direction: Direction) => {
  const [nodesAndEdges, setNodesAndEdges] = useState<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });

  const addressEntries = useAddressEntries(xpub, scriptType);

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
        const spendingTransactions = addressEntry.transactions.filter((t) =>
          t.vin.some((vin) =>
            addressEntry.transactions.some((tx) =>
              tx.vout.some(
                (vout) =>
                  tx.txid !== t.txid && vout.n === vin.vout && vout.scriptPubKey.address === addressEntry.address
              )
            )
          )
        );

        for (const transaction of spendingTransactions) {
          for (const vout of transaction.vout) {
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
    [addressEntries, direction]
  );

  const getXpubAddressesNodesAndEdges = useCallback(
    (nodes: PositionlessNode[], edges: Edge[], xpubNode: Omit<XpubNodeType, "position">) => {
      const xpubAddressEntries = Object.values(addressEntries).filter((a) => !a.isChange && a.transactions.length > 0);

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

  useEffect(() => {
    setNodesAndEdges(getNodesAndEdges());
  }, [getNodesAndEdges]);

  return useMemo(() => nodesAndEdges, [nodesAndEdges]);
};
