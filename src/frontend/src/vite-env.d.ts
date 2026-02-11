/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DFX_NETWORK: string;
  readonly CANISTER_ID_BACKEND: string;
  readonly BACKEND_CANISTER_ID: string;
  readonly CANISTER_ID_INTERNET_IDENTITY: string;
  readonly DEV_BYPASS_II: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
