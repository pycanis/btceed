import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { GET_DB_SETTINGS, GET_DB_XPUBS } from "../../constants";
import { useDatabaseContext } from "../../contexts/DatabaseContext";
import { getWallet } from "../../utils/wallet";
import { XpubFormModal } from "../XpubFormModal";
import { GraphComponent } from "./GraphComponent";

export const Graph = () => {
  const { db } = useDatabaseContext();

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: [GET_DB_SETTINGS],
    queryFn: () => db.getAll("settings"),
  });

  console.log(settings);

  const { data: xpubStoreValues = [], isLoading } = useQuery({
    queryKey: [GET_DB_XPUBS],
    queryFn: () => db.getAll("xpubs"),
  });

  const wallets = useMemo(() => xpubStoreValues.map(getWallet), [xpubStoreValues]);

  if (isLoading || isSettingsLoading) {
    return <div>loading..</div>;
  }

  return (
    <>
      <GraphComponent key={wallets.length} wallets={wallets} settings={settings?.[0]} />

      {wallets.length === 0 && <XpubFormModal />}
    </>
  );
};
