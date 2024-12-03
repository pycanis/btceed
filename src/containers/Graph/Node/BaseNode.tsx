import { CSSProperties, ReactNode, useCallback } from "react";
import { useGraphContext } from "../GraphContext";

type Props = {
  id: string;
  children: ReactNode;
  style: CSSProperties;
};

export const BaseNode = ({ id, children, style }: Props) => {
  const { setHoveredNodeId } = useGraphContext();

  const handleMouseEnter = useCallback(() => setHoveredNodeId(id), [id, setHoveredNodeId]);
  const handleMouseLeave = useCallback(() => setHoveredNodeId(null), [setHoveredNodeId]);

  return (
    <div
      className="w-28 h-6 rounded-md text-xs font-bold flex justify-center items-center border-2 border-text dark:border-darkText"
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};
