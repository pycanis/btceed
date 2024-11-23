import { Graph } from "./containers/Graph/Graph";
import { XpubModal } from "./containers/XpubModal";
import { useWalletContext } from "./contexts/WalletContext";

export const App = () => {
  const { wallets } = useWalletContext();

  return <div className="w-screen h-screen">{wallets.length > 0 ? <Graph /> : <XpubModal />}</div>;
};
