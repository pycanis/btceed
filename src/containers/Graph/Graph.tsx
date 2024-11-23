import { GraphComponent } from "./GraphComponent";
import { useAddressEntriesAndTransactions } from "./hooks/useAddressEntriesAndTransactions";

export const Graph = () => {
  const { addressEntries, transactions, isLoading } = useAddressEntriesAndTransactions();

  if (isLoading) {
    return <div>loading..</div>;
  }

  return <GraphComponent addressEntries={addressEntries} transactions={transactions} />;
};
