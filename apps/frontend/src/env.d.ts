/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAP_KEY: string;
  readonly VITE_NK_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
