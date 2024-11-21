import dagre from "@dagrejs/dagre";
import { Edge, Node } from "@xyflow/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AddressEntry, AddressNode as AddressNodeType, ScriptType, XpubNode as XpubNodeType } from "../../types";
import { useAddressEntries } from "./useAddressEntries";

const xpub = "";

const scriptType: ScriptType = "p2wpkh";

type UseNodesAndEdgesParams = {
  nodeWidth: number;
  nodeHeight: number;
  isVertical: boolean;
};

export const useNodesAndEdges = ({ nodeWidth, nodeHeight, isVertical }: UseNodesAndEdgesParams) => {
  const [nodesAndEdges, setNodesAndEdges] = useState<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });

  const addressEntries = useAddressEntries(xpub, scriptType);

  const dagreGraph = useMemo(() => new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({})), []);

  const getLayoutedNodesAndEdges = useCallback(
    (nodes: Omit<Node, "position">[], edges: Edge[], isVertical: boolean) => {
      dagreGraph.setGraph({ rankdir: isVertical ? "TB" : "LR" });

      nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
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
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
          },
        };

        return newNode;
      });

      return { nodes: newNodes, edges };
    },
    [dagreGraph, nodeWidth, nodeHeight]
  );

  const populateAddressNodesAndEdges = useCallback(
    (nodes: Omit<Node, "position">[], edges: Edge[], currentLevelAddressEntries: AddressEntry[]) => {
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

            const node: Omit<AddressNodeType, "position"> = {
              id: address,
              data: { ...(nextLevelAddressEntry || { address, transactions: [] }), isVertical },
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
    [addressEntries, isVertical]
  );

  const getXpubAddressesNodesAndEdges = useCallback(
    (xpubNode: Omit<XpubNodeType, "position">) => {
      const nodes: Omit<Node, "position">[] = [];
      const edges: Edge[] = [];

      const xpubAddressEntries = Object.values(addressEntries).filter((a) => !a.isChange && a.transactions.length > 0);

      for (const addressEntry of xpubAddressEntries) {
        const node: Omit<AddressNodeType, "position"> = {
          id: addressEntry.address,
          data: { ...addressEntry, isVertical },
          type: "addressNode",
        };

        nodes.push(node);

        edges.push({
          id: `${xpubNode.id}-${node.id}`,
          source: xpubNode.id,
          target: node.id,
        });
      }

      return { xpubAddressEntries, nodes, edges };
    },
    [addressEntries, isVertical]
  );

  const getNodesAndEdges = useCallback(() => {
    const nodes: Omit<Node, "position">[] = [];
    const edges: Edge[] = [];

    const xpubNode: Omit<XpubNodeType, "position"> = {
      id: xpub,
      data: { xpub, isVertical },
      type: "xpubNode",
    };

    nodes.push(xpubNode);

    const {
      xpubAddressEntries,
      nodes: xpubAddressesNodes,
      edges: xpubAddressesEdges,
    } = getXpubAddressesNodesAndEdges(xpubNode);

    nodes.push(...xpubAddressesNodes);
    edges.push(...xpubAddressesEdges);

    populateAddressNodesAndEdges(nodes, edges, xpubAddressEntries);

    setNodesAndEdges(getLayoutedNodesAndEdges(nodes, edges, isVertical));
  }, [getLayoutedNodesAndEdges, getXpubAddressesNodesAndEdges, populateAddressNodesAndEdges, isVertical]);

  useEffect(() => {
    getNodesAndEdges();
  }, [getNodesAndEdges]);

  return useMemo(() => nodesAndEdges, [nodesAndEdges]);
};
