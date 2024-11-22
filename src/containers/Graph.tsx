import { Background, BackgroundVariant, Controls, Edge, Node, Panel, ReactFlow, useReactFlow } from "@xyflow/react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { nodeTypes } from "./Node";
import { useNodesAndEdges } from "./hooks/useNodesAndEdges";

import "@xyflow/react/dist/style.css";
import { Direction } from "../types";

export const Graph = () => {
  const [direction, setDirection] = useState<Direction>("TB");

  const nodesAndEdges = useNodesAndEdges(direction);

  return (
    <ReactFlow
      nodes={nodesAndEdges.nodes}
      edges={nodesAndEdges.edges}
      nodeTypes={nodeTypes}
      proOptions={{ hideAttribution: true }}
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      edgesFocusable={false}
      edgesReconnectable={false}
    >
      <ReactFlowControls setDirection={setDirection} nodesAndEdges={nodesAndEdges} />
    </ReactFlow>
  );
};

type Props = {
  setDirection: Dispatch<SetStateAction<Direction>>;
  nodesAndEdges: {
    nodes: Node[];
    edges: Edge[];
  };
};

const ReactFlowControls = ({ setDirection, nodesAndEdges }: Props) => {
  const { fitView } = useReactFlow();

  useEffect(() => {
    // hack to fit into view on direction change
    setTimeout(() => {
      fitView();
    }, 0);
  }, [fitView, nodesAndEdges]);

  return (
    <>
      <Panel position="top-left">
        <button onClick={() => setDirection("TB")}>top-bottom</button>
        <button onClick={() => setDirection("LR")}>left-right</button>
        <button onClick={() => setDirection("BT")}>bottom-top</button>
        <button onClick={() => setDirection("RL")}>right-left</button>
      </Panel>
      <Background color="red" variant={BackgroundVariant.Dots} />
      <Controls />
      {/*       <MiniMap zoomable pannable /> */}
    </>
  );
};
