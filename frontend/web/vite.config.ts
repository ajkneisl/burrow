import { defineConfig, type Plugin } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

type AppEnv = "dev" | "staging" | "prod"

const FAVICONS: Record<AppEnv, string> = {
    dev: "/image/burrow-dev.png",
    staging: "/image/burrow-staging.png",
    prod: "/image/burrow.png"
}

function resolveAppEnv(command: "serve" | "build"): AppEnv {
    const raw = (process.env.VITE_APP_ENV ?? "").trim().toLowerCase()

    if (["dev", "development", "local"].includes(raw)) return "dev"
    if (["staging", "stage"].includes(raw)) return "staging"
    if (["prod", "production"].includes(raw)) return "prod"

    if (raw) {
        console.warn(`[env] unrecognized VITE_APP_ENV "${raw}", ignoring`)
    }

    return command === "serve" ? "dev" : "prod"
}

/** Swaps the favicon so dev and staging tabs are distinguishable from prod. */
function environmentFavicon(appEnv: AppEnv): Plugin {
    return {
        name: "burrow-environment-favicon",
        enforce: "pre",
        transformIndexHtml(html) {
            return html.replace(
                /(<link[^>]*rel="icon"[^>]*href=")[^"]*(")/,
                `$1${FAVICONS[appEnv]}$2`
            )
        }
    }
}

async function loadBitwardenSecrets() {
    const accessToken = process.env.BWS_TOKEN
    if (!accessToken) return

    const organizationId = process.env.BWS_ORG_ID
    if (!organizationId) {
        throw new Error(
            "BWS_ACCESS_TOKEN is set but BWS_ORG_ID is missing"
        )
    }

    const { BitwardenClient } = await import("@bitwarden/sdk-napi")

    const client = new BitwardenClient()

    try {
        await client.auth().loginAccessToken(accessToken)
    } catch (error) {
        throw new Error(
            "Bitwarden Secrets Manager login failed",
            { cause: error }
        )
    }

    const { secrets } = await client.secrets().sync(organizationId)
    const projectId = process.env.BWS_PROJECT_ID
    let loaded = 0

    for (const secret of secrets ?? []) {
        if (projectId && secret.projectId !== projectId) continue
        if (!secret.key.startsWith("VITE_")) continue
        if (process.env[secret.key] !== undefined) continue

        process.env[secret.key] = secret.value
        loaded++
    }

    console.log(`[bws] loaded ${loaded} secret(s) from Bitwarden`)
}

// https://vite.dev/config/
export default defineConfig(async ({ command }) => {
    await loadBitwardenSecrets()

    const appEnv = resolveAppEnv(command)
    console.log(`[env] building for ${appEnv}`)

    return {
        // Vite 8 resolves tsconfig `paths` natively, replacing vite-tsconfig-paths
        resolve: { tsconfigPaths: true },
        plugins: [environmentFavicon(appEnv), react(), tailwindcss()],
        define: {
            "import.meta.env.VITE_APP_ENV": JSON.stringify(appEnv)
        }
    }
})
