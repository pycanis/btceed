import { Background, BackgroundVariant, Controls, Panel, ReactFlow } from "@xyflow/react";
import { useState } from "react";
import { nodeTypes } from "./Node";
import { useNodesAndEdges } from "./hooks/useNodesAndEdges";

import "@xyflow/react/dist/style.css";

const NODE_WIDTH = 144;
const NODE_HEIGHT = 40;

export const Graph = () => {
  const [isVertical, setIsVertical] = useState(true);

  const { nodes, edges } = useNodesAndEdges({
    nodeWidth: NODE_WIDTH,
    nodeHeight: NODE_HEIGHT,
    isVertical,
  });

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      proOptions={{ hideAttribution: true }}
      fitView
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      edgesFocusable={false}
      edgesReconnectable={false}
    >
      <Panel position="top-left">
        <button onClick={() => setIsVertical(!isVertical)}>{isVertical ? "horizontal" : "vertical"}</button>
      </Panel>
      <Background color="red" variant={BackgroundVariant.Dots} />
      <Controls />
      {/*       <MiniMap zoomable pannable /> */}
    </ReactFlow>
  );
};
