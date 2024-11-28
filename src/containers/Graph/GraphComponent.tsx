import dagre from "@dagrejs/dagre";
import { Edge, ReactFlow } from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";
import { NODE_HEIGHT, NODE_WIDTH } from "../../constants";
import { AddressEntry, Direction, PositionlessNode, Wallet } from "../../types";
import { useNodesAndEdges } from "./hooks/useNodesAndEdges";
import { nodeTypes } from "./Node";

import "@xyflow/react/dist/style.css";
import { Controls } from "./Controls/Controls";
import { useAddressEntriesAndTransactions } from "./hooks/useAddressEntriesAndTransactions";

type Props = {
  wallets: Wallet[];
};

export const GraphComponent = ({ wallets }: Props) => {
  const [direction, setDirection] = useState<Direction>("TB");
  const { populateNodesAndEdges } = useNodesAndEdges(direction);

  const { addressEntries, transactions, isLoading } = useAddressEntriesAndTransactions(wallets);

  const dagreGraph = useMemo(() => new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({})), []);

  const getLayoutedNodesAndEdges = useCallback(
    (nodes: PositionlessNode[], edges: Edge[], direction: Direction) => {
      dagreGraph.setGraph({ rankdir: direction, ranksep: 200 });

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

  const { nodes, edges } = useMemo(() => {
    if (isLoading) {
      return { nodes: [], edges: [] };
    }

    const allNodes: PositionlessNode[] = [];
    const allEdges: Edge[] = [];

    const adjacentAddressEntries = Object.values(addressEntries).reduce((acc, addressEntry) => {
      addressEntry.transactionIds.some((transactionId) =>
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

    return getLayoutedNodesAndEdges(allNodes, allEdges, direction);
  }, [wallets, isLoading, populateNodesAndEdges, getLayoutedNodesAndEdges, addressEntries, transactions, direction]);

  if (isLoading) {
    return <>loading..</>;
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      edgesFocusable={false}
      edgesReconnectable={false}
      panOnScroll={false} // todo: configurable
      fitView
    >
      <Controls direction={direction} setDirection={setDirection} />
    </ReactFlow>
  );
};
