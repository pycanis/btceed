import { useGraphContext } from "../../contexts/GraphContext/GraphContext";
import { WalletFormModal } from "../WalletFormModal";
import { GraphComponent } from "./GraphComponent";

export const Graph = () => {
  const { graphData } = useGraphContext();

  return (
    <>
      <GraphComponent />

      {graphData.wallets.length === 0 && <WalletFormModal />}
    </>
  );
};
