import react from "@vitejs/plugin-react-swc";
import { defineConfig, loadEnv } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
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
  plugins: [
    react(),
    wasm(),
    nodePolyfills({
      include: ["buffer"],
    }),
    {
      name: "add-script-tag",
      transformIndexHtml(html) {
        const env = loadEnv("production", ".");

        if (env.VITE_ENABLE_ANALYTICS === "true") {
          return html.replace(
            "</head>",
            `  <script defer data-domain="app.btceed.live" src="https://plausible.btceed.live/js/script.js"></script></head>`
          );
        }
        return html;
      },
    },
  ],
  build: { target: "esnext" },
});
