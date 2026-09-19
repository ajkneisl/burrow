import { defineConfig, type Plugin } from "vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import babel from "@rolldown/plugin-babel"
import tailwindcss from "@tailwindcss/vite"

type AppEnv = "dev" | "staging" | "prod"

const BASE = "/admin/"

// Vite leaves public-dir URLs in index.html alone, so these carry the base themselves.
const FAVICONS: Record<AppEnv, string> = {
    dev: `${BASE}image/burrow-dev.png`,
    staging: `${BASE}image/burrow-staging.png`,
    prod: `${BASE}image/burrow.png`
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

/** Loads VITE_* values from AWS Parameter Store when PARAMETER_STORE_PATH is set. */
async function loadParameterStore() {
    const path = process.env.PARAMETER_STORE_PATH?.replace(/\/+$/, "")
    if (!path) return

    const { SSMClient, paginateGetParametersByPath } = await import(
        "@aws-sdk/client-ssm"
    )

    const client = new SSMClient({})
    let loaded = 0

    for await (const page of paginateGetParametersByPath(
        { client },
        { Path: path, Recursive: true, WithDecryption: true }
    )) {
        for (const parameter of page.Parameters ?? []) {
            const key = parameter.Name!.slice(path.length + 1)
            if (!key.startsWith("VITE_")) continue
            if (process.env[key] !== undefined) continue

            process.env[key] = parameter.Value
            loaded++
        }
    }

    console.log(`[ssm] loaded ${loaded} parameter(s) from Parameter Store`)
}

// https://vite.dev/config/
export default defineConfig(async ({ command }) => {
    await loadParameterStore()

    const appEnv = resolveAppEnv(command)
    console.log(`[env] building for ${appEnv}`)

    return {
        base: BASE,
        // Vite 8 resolves tsconfig `paths` natively, replacing vite-tsconfig-paths
        resolve: { tsconfigPaths: true },
        plugins: [
            environmentFavicon(appEnv),
            tailwindcss(),
            react(),
            // React Compiler moved out of plugin-react's options in v6
            babel({ presets: [reactCompilerPreset()] })
        ],
        define: {
            "import.meta.env.VITE_APP_ENV": JSON.stringify(appEnv)
        }
    }
})
