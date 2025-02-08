import { useQuery } from "@tanstack/react-query";
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useMemo, useState } from "react";
import { Loader } from "../../components/Loader";
import { GET_DB_EXCHANGE_RATES, GET_DB_LABELS } from "../../constants";
import { AddressEntry, Currencies, Transaction, Wallet } from "../../types";
import { useDatabaseContext } from "../DatabaseContext";
import { useGraphData } from "./hooks/useGraphData";

type GraphContext = {
  hoveredNodeId: string | null;
  setHoveredNodeId: Dispatch<SetStateAction<string | null>>;
  graphData: {
    wallets: Wallet[];
    addressEntries: Record<string, AddressEntry>;
    adjacentAddressEntries: Record<string, AddressEntry>;
    transactions: Record<string, Transaction>;
    calculateTransactionFeeInSats: (transaction: Transaction) => number;
    isSpendingTransaction: (transaction: Transaction, xpub?: string) => boolean;
    calculateTransactionSpentInSats: (transaction: Transaction, xpub?: string) => number;
    calculateTransactionReceivedInSats: (transaction: Transaction, xpub?: string) => number;
    isLoading: boolean;
  };
  labels: Record<string, string>;
  exchangeRates: Record<number, Record<Currencies, number>>;
  isCsvExportLoading: boolean;
  setIsCsvExportLoading: Dispatch<SetStateAction<boolean>>;
};

const GraphContext = createContext({} as GraphContext);

type Props = {
  children: ReactNode;
};

export const GraphProvider = ({ children }: Props) => {
  const { db } = useDatabaseContext();
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const graphData = useGraphData();
  const [isCsvExportLoading, setIsCsvExportLoading] = useState(false);

  const { data: labelStoreValues = [] } = useQuery({
    queryKey: [GET_DB_LABELS],
    queryFn: () => db.getAll("labels"),
  });

  const { data: exchangeRatesStoreValues = [] } = useQuery({
    queryKey: [GET_DB_EXCHANGE_RATES],
    queryFn: () => db.getAll("exchangeRates"),
  });

  const labels = useMemo(
    () =>
      labelStoreValues.reduce((acc, labelStoreValue) => {
        acc[labelStoreValue.id] = labelStoreValue.label;

        return acc;
      }, {} as Record<string, string>),
    [labelStoreValues]
  );

  const exchangeRates = useMemo(
    () =>
      exchangeRatesStoreValues.reduce((acc, exchangeRateStoreValue) => {
        acc[exchangeRateStoreValue.tsInSeconds] = exchangeRateStoreValue.rates;

        return acc;
      }, {} as Record<number, Record<Currencies, number>>),
    [exchangeRatesStoreValues]
  );

  const contextValue = useMemo(
    () => ({
      hoveredNodeId,
      setHoveredNodeId,
      graphData,
      labels,
      exchangeRates,
      isCsvExportLoading,
      setIsCsvExportLoading,
    }),
    [hoveredNodeId, graphData, labels, exchangeRates, isCsvExportLoading]
  );

  return (
    <GraphContext.Provider value={contextValue}>{graphData.isLoading ? <Loader /> : children}</GraphContext.Provider>
  );
};

export const useGraphContext = () => {
  const context = useContext(GraphContext);

  if (!context) {
    throw new Error("Not inside GraphContext.");
  }

  return context;
};
