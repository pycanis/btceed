import dagre from "@dagrejs/dagre";
import { Edge, ReactFlow } from "@xyflow/react";
import { useCallback, useMemo } from "react";
import { NODE_HEIGHT, NODE_WIDTH } from "../../constants";
import { useSettingsContext } from "../../contexts/SettingsContext";
import { AddressEntry, PositionlessNode, Wallet } from "../../types";
import { Controls } from "./Controls/Controls";
import { useAddressEntriesAndTransactions } from "./hooks/useAddressEntriesAndTransactions";
import { useNodesAndEdges } from "./hooks/useNodesAndEdges";
import { nodeTypes } from "./Node";

import "@xyflow/react/dist/style.css";
import { edgeTypes } from "./Edge";

type Props = {
  wallets: Wallet[];
};

export const GraphComponent = ({ wallets }: Props) => {
  const { settings } = useSettingsContext();
  const { populateNodesAndEdges } = useNodesAndEdges();

  const { addressEntries, transactions, isLoading } = useAddressEntriesAndTransactions();

  const getLayoutedNodesAndEdges = useCallback(
    (nodes: PositionlessNode[], edges: Edge[]) => {
      const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

      dagreGraph.setGraph({ rankdir: settings.direction, ranksep: settings.spacing });

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
    [settings.direction, settings.spacing]
  );

  const { nodes, edges } = useMemo(() => {
    if (isLoading) {
      return { nodes: [], edges: [] };
    }

    const allNodes: Record<string, PositionlessNode> = {};
    const allEdges: Record<string, Edge> = {};

    const adjacentAddressEntries = Object.values(addressEntries).reduce((acc, addressEntry) => {
      addressEntry.transactionIds!.some((transactionId) =>
        transactions[transactionId].vout.some((vout) => {
          const existingAddressEntry = addressEntries[vout.scriptPubKey.address];

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
    }, {} as Record<string, AddressEntry>);

    for (const wallet of wallets) {
      populateNodesAndEdges(wallet, allNodes, allEdges, addressEntries, transactions, adjacentAddressEntries);
    }

    return getLayoutedNodesAndEdges(
      Object.values(allNodes).map((node) => node),
      Object.values(allEdges).map((edge) => edge)
    );
  }, [wallets, isLoading, populateNodesAndEdges, getLayoutedNodesAndEdges, addressEntries, transactions]);

  if (isLoading) {
    return <>loading..</>;
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      edgesFocusable={false}
      edgesReconnectable={false}
      panOnScroll={settings.panOnScroll}
      fitView
    >
      <Controls />
    </ReactFlow>
  );
};
