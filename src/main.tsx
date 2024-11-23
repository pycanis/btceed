import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { ElectrumProvider } from "./contexts/ElectrumContext.tsx";
import { WalletProvider } from "./contexts/WalletContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ElectrumProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </ElectrumProvider>
  </StrictMode>
);
