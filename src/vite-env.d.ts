/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_EMAIL?: string;
  readonly VITE_ADMIN_PASSWORD?: string;
  readonly VITE_AI_API_URL?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
