import { useQuery } from "@tanstack/react-query";
import { Loader } from "../../components/Loader";
import { GET_DB_WALLETS } from "../../constants";
import { useDatabaseContext } from "../../contexts/DatabaseContext";
import { GraphProvider } from "../../contexts/GraphContext/GraphContext";
import { WalletFormModal } from "../WalletFormModal";
import { GraphComponent } from "./GraphComponent";

export const Graph = () => {
  const { db } = useDatabaseContext();

  const { data: wallets = [], isLoading } = useQuery({
    queryKey: [GET_DB_WALLETS],
    queryFn: () => db.getAllFromIndex("wallets", "createdAt"),
  });

  if (isLoading) {
    return <Loader />;
  }

  return (
    <>
      <GraphProvider>
        <GraphComponent wallets={wallets} />
      </GraphProvider>

      {wallets.length === 0 && <WalletFormModal />}
    </>
  );
};
