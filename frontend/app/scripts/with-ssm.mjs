import { spawn } from "node:child_process"

const [command, ...args] = process.argv.slice(2)

if (!command) {
    console.error("usage: node scripts/with-ssm.mjs <command> [args...]")
    process.exit(1)
}

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
            const key = parameter.Name.slice(path.length + 1)
            // never clobber vars exported in the shell
            if (process.env[key] !== undefined) continue

            process.env[key] = parameter.Value
            loaded++
        }
    }

    console.log(`[ssm] loaded ${loaded} parameter(s) from Parameter Store`)
}

await loadParameterStore()

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
