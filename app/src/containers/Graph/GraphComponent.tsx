import dagre from "@dagrejs/dagre";
import { Edge, ReactFlow } from "@xyflow/react";
import { useCallback, useMemo } from "react";
import { useSettingsContext } from "../../contexts/SettingsContext";
import { PositionlessNode } from "../../types";
import { Controls } from "./Controls/Controls";
import { CustomEdge } from "./Edge";
import { useNodesAndEdges } from "./hooks/useNodesAndEdges";
import { Links } from "./Links";
import { AddressNode } from "./Node/AddressNode";
import { XpubNode } from "./Node/XpubNode";
import { Notifications } from "./Notifications";

import "@xyflow/react/dist/style.css";

export const GraphComponent = () => {
  const { settings } = useSettingsContext();
  const nodesAndEdges = useNodesAndEdges();

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
    const { nodes, edges } = nodesAndEdges;

    return getLayoutedNodesAndEdges(Object.values(nodes), Object.values(edges));
  }, [nodesAndEdges, getLayoutedNodesAndEdges]);

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

      <Links />
    </ReactFlow>
  );
};
