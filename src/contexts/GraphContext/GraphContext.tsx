import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useMemo, useState } from "react";
import { AddressEntry, Transaction } from "../../types";
import { useAddressEntriesAndTransactions } from "./hooks/useAddressEntriesAndTransactions";

type GraphContext = {
  hoveredNodeId: string | null;
  setHoveredNodeId: Dispatch<SetStateAction<string | null>>;
  addressEntriesAndTransactions: {
    addressEntries: Record<string, AddressEntry>;
    transactions: Record<string, Transaction>;
    calculateTransactionFeeInSats: (transaction: Transaction, xpub: string) => number;
    isLoading: boolean;
  };
};

const GraphContext = createContext({} as GraphContext);

type Props = {
  children: ReactNode;
};

export const GraphProvider = ({ children }: Props) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const addressEntriesAndTransactions = useAddressEntriesAndTransactions();

  const contextValue = useMemo(
    () => ({ hoveredNodeId, setHoveredNodeId, addressEntriesAndTransactions }),
    [hoveredNodeId, addressEntriesAndTransactions]
  );

  return <GraphContext.Provider value={contextValue}>{children}</GraphContext.Provider>;
};

export const useGraphContext = () => {
  const context = useContext(GraphContext);

  if (!context) {
    throw new Error("Not inside GraphContext.");
  }

  return context;
};
