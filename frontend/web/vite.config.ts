import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

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
export default defineConfig(async () => {
    await loadBitwardenSecrets()

    return {
        // Vite 8 resolves tsconfig `paths` natively, replacing vite-tsconfig-paths
        resolve: { tsconfigPaths: true },
        plugins: [react(), tailwindcss()]
    }
})
