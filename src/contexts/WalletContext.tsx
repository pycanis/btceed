import { HDKey } from "@scure/bip32";
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useMemo, useState } from "react";
import { ScriptType } from "../types";

export type Wallet = {
  hdKey: HDKey;
  scriptType: ScriptType;
};

type WalletContext = {
  wallets: Wallet[];
  setWallets: Dispatch<SetStateAction<Wallet[]>>;
};

const WalletContext = createContext({} as WalletContext);

type Props = {
  children: ReactNode;
};

export const WalletProvider = ({ children }: Props) => {
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const contextValue = useMemo(() => ({ wallets, setWallets }), [wallets]);

  return <WalletContext.Provider value={contextValue}>{children}</WalletContext.Provider>;
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("Not inside WalletContext.");
  }

  return context;
};
