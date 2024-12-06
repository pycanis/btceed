import { useQuery } from "@tanstack/react-query";
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useMemo, useState } from "react";
import { GET_DB_LABELS } from "../../constants";
import { AddressEntry, Transaction } from "../../types";
import { useDatabaseContext } from "../DatabaseContext";
import { useAddressEntriesAndTransactions } from "./hooks/useAddressEntriesAndTransactions";

type GraphContext = {
  hoveredNodeId: string | null;
  setHoveredNodeId: Dispatch<SetStateAction<string | null>>;
  addressEntriesAndTransactions: {
    addressEntries: Record<string, AddressEntry>;
    transactions: Record<string, Transaction>;
    calculateTransactionFeeInSats: (transaction: Transaction) => number;
    isLoading: boolean;
  };
  labels: Record<string, string>;
};

const GraphContext = createContext({} as GraphContext);

type Props = {
  children: ReactNode;
};

export const GraphProvider = ({ children }: Props) => {
  const { db } = useDatabaseContext();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const addressEntriesAndTransactions = useAddressEntriesAndTransactions();

  const { data: labelStoreValues = [] } = useQuery({
    queryKey: [GET_DB_LABELS],
    queryFn: () => db.getAll("labels"),
  });

  const labels = useMemo(
    () =>
      labelStoreValues.reduce((acc, labelStoreValue) => {
        acc[labelStoreValue.id] = labelStoreValue.label;

        return acc;
      }, {} as Record<string, string>),
    [labelStoreValues]
  );

  const contextValue = useMemo(
    () => ({ hoveredNodeId, setHoveredNodeId, addressEntriesAndTransactions, labels }),
    [hoveredNodeId, addressEntriesAndTransactions, labels]
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
