/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_GATE_KEY?: string
  readonly VITE_RESPINS_PER_RUN?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  readonly VITE_ANALYTICS_IN_DEV?: string
  readonly VITE_WEB3FORMS_ACCESS_KEY?: string
  readonly VITE_FEEDBACK_EMAIL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
