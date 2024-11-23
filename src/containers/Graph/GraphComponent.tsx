import dagre from "@dagrejs/dagre";
import { Edge, ReactFlow } from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";
import { NODE_HEIGHT, NODE_WIDTH } from "../../constants";
import { useWalletContext } from "../../contexts/WalletContext";
import { AddressEntry, Direction, PositionlessNode, Transaction } from "../../types";
import { GraphControls } from "./GraphControls";
import { useNodesAndEdges } from "./hooks/useNodesAndEdges";
import { nodeTypes } from "./Node";

import "@xyflow/react/dist/style.css";

type Props = {
  addressEntries: Record<string, AddressEntry>;
  transactions: Record<string, Transaction>;
};

export const GraphComponent = ({ addressEntries, transactions }: Props) => {
  const { wallets } = useWalletContext();
  const [direction, setDirection] = useState<Direction>("TB");
  const { populateNodesAndEdges } = useNodesAndEdges(direction);

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
    const allNodes: PositionlessNode[] = [];
    const allEdges: Edge[] = [];

    for (const wallet of wallets) {
      populateNodesAndEdges(wallet, allNodes, allEdges, addressEntries, transactions);
    }

    return getLayoutedNodesAndEdges(allNodes, allEdges, direction);
  }, [wallets, populateNodesAndEdges, getLayoutedNodesAndEdges, addressEntries, transactions, direction]);

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
      <GraphControls direction={direction} setDirection={setDirection} />
    </ReactFlow>
  );
};
