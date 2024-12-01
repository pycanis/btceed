import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { GET_DB_XPUBS } from "../../constants";
import { useDatabaseContext } from "../../contexts/DatabaseContext";
import { getWallet } from "../../utils/wallet";
import { XpubFormModal } from "../XpubFormModal";
import { GraphComponent } from "./GraphComponent";
import { GraphProvider } from "./GraphContext";

export const Graph = () => {
  const { db } = useDatabaseContext();

  const { data: xpubStoreValues = [], isLoading } = useQuery({
    queryKey: [GET_DB_XPUBS],
    queryFn: () => db.getAllFromIndex("xpubs", "createdAt"),
  });

  const wallets = useMemo(() => xpubStoreValues.map(getWallet), [xpubStoreValues]);

  if (isLoading) {
    return <div>loading..</div>;
  }

  return (
    <>
      <GraphProvider>
        <GraphComponent wallets={wallets} />
      </GraphProvider>

      {wallets.length === 0 && <XpubFormModal />}
    </>
  );
};
