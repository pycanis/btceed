import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useMemo, useState } from "react";

type ElectrumContext = {
  electrumUrl: string;
  setElectrumUrl: Dispatch<SetStateAction<string>>;
};

const ElectrumContext = createContext({} as ElectrumContext);

type Props = {
  children: ReactNode;
};

const defaultElectrumUrl = "ws://192.168.4.11:50003";

export const ElectrumProvider = ({ children }: Props) => {
  const [electrumUrl, setElectrumUrl] = useState(defaultElectrumUrl);

  const contextValue = useMemo(() => ({ setElectrumUrl, electrumUrl }), [electrumUrl]);

  return <ElectrumContext.Provider value={contextValue}>{children}</ElectrumContext.Provider>;
};

export const useElectrumContext = () => {
  const context = useContext(ElectrumContext);

  if (!context) {
    throw new Error("Not inside ElectrumContext.");
  }

  return context;
};
