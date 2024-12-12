/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ELECTRUM_WS_SERVER_URL: string;
  readonly VITE_BLOCKCHAIN_EXPLORER_URL: string;
  readonly VITE_PUBLIC_ELECTRUM_SERVER_WARNING: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
