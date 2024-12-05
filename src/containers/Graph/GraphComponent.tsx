import dagre from "@dagrejs/dagre";
import { Edge, ReactFlow } from "@xyflow/react";
import { useCallback, useMemo } from "react";
import { useGraphContext } from "../../contexts/GraphContext/GraphContext";
import { useSettingsContext } from "../../contexts/SettingsContext";
import { AddressEntry, PositionlessNode, Wallet } from "../../types";
import { Controls } from "./Controls/Controls";
import { CustomEdge } from "./Edge";
import { useNodesAndEdges } from "./hooks/useNodesAndEdges";
import { AddressNode } from "./Node/AddressNode";
import { XpubNode } from "./Node/XpubNode";

import "@xyflow/react/dist/style.css";

type Props = {
  wallets: Wallet[];
};

export const GraphComponent = ({ wallets }: Props) => {
  const { settings } = useSettingsContext();
  const { populateNodesAndEdges } = useNodesAndEdges();

  const {
    addressEntriesAndTransactions: { isLoading, addressEntries, transactions },
  } = useGraphContext();

  const getLayoutedNodesAndEdges = useCallback(
    (nodes: PositionlessNode[], edges: Edge[]) => {
      const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

      dagreGraph.setGraph({ rankdir: settings.direction, ranksep: settings.spacing });

      nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 70 });
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
            x: nodeWithPosition.x,
            y: nodeWithPosition.y,
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
      populateNodesAndEdges(wallet, allNodes, allEdges, adjacentAddressEntries);
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
      nodeTypes={{ xpubNode: XpubNode, addressNode: AddressNode }}
      edgeTypes={{ customEdge: CustomEdge }}
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
