import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useMemo, useState } from "react";

type GraphContext = {
  hoveredNodeId: string | null;
  setHoveredNodeId: Dispatch<SetStateAction<string | null>>;
};

const GraphContext = createContext({} as GraphContext);

type Props = {
  children: ReactNode;
};

export const GraphProvider = ({ children }: Props) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const contextValue = useMemo(() => ({ hoveredNodeId, setHoveredNodeId }), [hoveredNodeId]);

  return <GraphContext.Provider value={contextValue}>{children}</GraphContext.Provider>;
};

export const useGraphContext = () => {
  const context = useContext(GraphContext);

  if (!context) {
    throw new Error("Not inside GraphContext.");
  }

  return context;
};
