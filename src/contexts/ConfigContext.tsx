import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useMemo, useState } from "react";

type ConfigContext = {
  electrumUrl: string;
  setElectrumUrl: Dispatch<SetStateAction<string>>;
  blockExplorerUrl: string;
  setBlockExplorerUrl: Dispatch<SetStateAction<string>>;
};

const ConfigContext = createContext({} as ConfigContext);

type Props = {
  children: ReactNode;
};

const defaultElectrumUrl = "ws://192.168.4.11:50003";
const defaultBlockExplorerUrl = "https://mempool.space";

export const ConfigProvider = ({ children }: Props) => {
  const [electrumUrl, setElectrumUrl] = useState(defaultElectrumUrl);
  const [blockExplorerUrl, setBlockExplorerUrl] = useState(defaultBlockExplorerUrl);

  const contextValue = useMemo(
    () => ({ setElectrumUrl, electrumUrl, blockExplorerUrl, setBlockExplorerUrl }),
    [electrumUrl, blockExplorerUrl]
  );

  return <ConfigContext.Provider value={contextValue}>{children}</ConfigContext.Provider>;
};

export const useConfigContext = () => {
  const context = useContext(ConfigContext);

  if (!context) {
    throw new Error("Not inside ConfigContext.");
  }

  return context;
};
