import dagre from "@dagrejs/dagre";
import { Edge, ReactFlow } from "@xyflow/react";
import { useCallback, useMemo } from "react";
import { useSettingsContext } from "../../contexts/SettingsContext";
import { PositionlessNode, Wallet } from "../../types";
import { Controls } from "./Controls/Controls";
import { CustomEdge } from "./Edge";
import { useNodesAndEdges } from "./hooks/useNodesAndEdges";
import { AddressNode } from "./Node/AddressNode";
import { XpubNode } from "./Node/XpubNode";

import "@xyflow/react/dist/style.css";
import { Notifications } from "./Notifications";

type Props = {
  wallets: Wallet[];
};

export const GraphComponent = ({ wallets }: Props) => {
  const { settings } = useSettingsContext();
  const { populateNodesAndEdges } = useNodesAndEdges();

  const getLayoutedNodesAndEdges = useCallback(
    (nodes: PositionlessNode[], edges: Edge[]) => {
      const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

      dagreGraph.setGraph({
        rankdir: settings.direction,
        ranksep: settings.graphSpacing,
        nodesep: settings.nodeSpacing,
      });

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
    [settings.direction, settings.graphSpacing, settings.nodeSpacing]
  );

  const { nodes, edges } = useMemo(() => {
    const allNodes: Record<string, PositionlessNode> = {};
    const allEdges: Record<string, Edge> = {};

    for (const wallet of wallets) {
      populateNodesAndEdges(wallet, allNodes, allEdges);
    }

    return getLayoutedNodesAndEdges(Object.values(allNodes), Object.values(allEdges));
  }, [wallets, populateNodesAndEdges, getLayoutedNodesAndEdges]);

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
      <Notifications />

      <Controls />
    </ReactFlow>
  );
};
