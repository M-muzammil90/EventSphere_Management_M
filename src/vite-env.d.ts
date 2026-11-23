/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_SOCKET_URL?: string;
  readonly VITE_PAYMENT_MODE?: "live" | "demo";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
