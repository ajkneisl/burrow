import { spawn } from "node:child_process"

const [command, ...args] = process.argv.slice(2)

if (!command) {
    console.error("usage: node scripts/with-bws.mjs <command> [args...]")
    process.exit(1)
}

async function loadBitwardenSecrets() {
    const accessToken = process.env.BWS_TOKEN
    if (!accessToken) return

    const organizationId = process.env.BWS_ORG_ID
    if (!organizationId) {
        throw new Error("BWS_TOKEN is set but BWS_ORG_ID is missing")
    }

    const { BitwardenClient } = await import("@bitwarden/sdk-napi")
    const client = new BitwardenClient()

    try {
        await client.auth().loginAccessToken(accessToken)
    } catch (error) {
        throw new Error("Bitwarden Secrets Manager login failed", {
            cause: error
        })
    }

    const { secrets } = await client.secrets().sync(organizationId)
    const projectId = process.env.BWS_PROJECT_ID
    let loaded = 0

    for (const secret of secrets ?? []) {
        if (projectId && secret.projectId !== projectId) continue
        // never clobber vars exported in the shell
        if (process.env[secret.key] !== undefined) continue

        process.env[secret.key] = secret.value
        loaded++
    }

    console.log(`[bws] loaded ${loaded} secret(s) from Bitwarden`)
}

await loadBitwardenSecrets()

const child = spawn(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32"
})

child.on("exit", (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal)
    } else {
        process.exit(code ?? 1)
    }
})
