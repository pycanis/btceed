import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { DatabaseProvider } from "./contexts/DatabaseContext.tsx";
import { SettingsProvider } from "./contexts/SettingsContext.tsx";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnMount: false, refetchOnReconnect: false, refetchOnWindowFocus: false } },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <DatabaseProvider>
        <SettingsProvider>
          <App />
        </SettingsProvider>
      </DatabaseProvider>
    </QueryClientProvider>
  </StrictMode>
);
