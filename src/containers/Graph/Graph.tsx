import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { DB_XPUBS_COLLECTION, GET_DB_XPUBS } from "../../constants";
import { useDatabaseContext } from "../../contexts/DatabaseContext";
import { getWallet } from "../../utils/wallet";
import { XpubFormModal } from "../XpubFormModal";
import { GraphComponent } from "./GraphComponent";

export const Graph = () => {
  const { db } = useDatabaseContext();

  const { data: xpubStoreValues = [], isLoading } = useQuery({
    queryKey: [GET_DB_XPUBS],
    queryFn: () => db.getAll(DB_XPUBS_COLLECTION),
  });

  const wallets = useMemo(() => xpubStoreValues.map(getWallet), [xpubStoreValues]);

  if (isLoading) {
    return <div>loading..</div>;
  }

  return (
    <>
      <GraphComponent key={wallets.length} wallets={wallets} />

      {wallets.length === 0 && <XpubFormModal />}
    </>
  );
};
