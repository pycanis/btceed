import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import wasm from "vite-plugin-wasm";

const ensureEnvVariables = (variables: string[]) => {
  const env = loadEnv("production", ".");

  const missingVariables: string[] = [];

  for (const variable of variables) {
    const value = env[variable];

    if (!value) {
      missingVariables.push(variable);
    }
  }

  if (missingVariables.length > 0) {
    throw new Error(`Missing env variables: ${missingVariables.join(", ")}`);
  }
};

ensureEnvVariables(["VITE_ELECTRUM_WS_SERVER_URL", "VITE_BLOCKCHAIN_EXPLORER_URL"]);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), wasm()],
  build: { target: "esnext" },
});
