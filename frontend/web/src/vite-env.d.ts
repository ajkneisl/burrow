/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_APP_ENV: "dev" | "staging" | "prod"
    readonly VITE_VERSION: string
    readonly VITE_BASE_URL: string
    readonly VITE_CDN_URL: string
    readonly VITE_GMAP_API_KEY: string
    readonly VITE_GOOGLE_CLIENT_ID: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
