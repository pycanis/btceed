import { BaseEdge, EdgeProps, getBezierPath } from "@xyflow/react";
import { useGraphContext } from "./GraphContext";

export const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY }: EdgeProps) => {
  const { hoveredNodeId } = useGraphContext();

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      className={hoveredNodeId && id.includes(hoveredNodeId) ? "stroke-2 stroke-primary dark:stroke-darkPrimary" : ""}
    />
  );
};
