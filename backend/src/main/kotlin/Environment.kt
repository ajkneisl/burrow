package app.burrow

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive

/**
 * secrets from Bitwarden Secret Manager.
 *
 * please refer to Bitwarden's docs on the secret manager cli for this :)
 */
private val bwsEnv by lazy {
    hashMapOf<String, String>().apply {
        val accessToken = System.getenv("BWS_TOKEN") ?: System.getenv("BWS_ACCESS_TOKEN")

        if (accessToken.isNullOrBlank()) {
            LOGGER.debug("BWS_TOKEN not set, skipping Bitwarden secrets")
            return@apply
        }

        LOGGER.debug("Loading BWS Secrets")

        try {
            val command = buildList {
                add("bws")
                add("secret")
                add("list")

                // scope to a single project when one is configured
                System.getenv("BWS_PROJECT_ID")?.let { add(it) }

                add("--output")
                add("json")
                add("--color")
                add("no")
                add("--access-token")
                add(accessToken)
            }

            val process = ProcessBuilder(command).start()
            val stdout = process.inputStream.bufferedReader().readText()
            val stderr = process.errorStream.bufferedReader().readText()

            if (process.waitFor() != 0) {
                LOGGER.error("bws exited with ${process.exitValue()}: ${stderr.trim()}")
                return@apply
            }

            Json.parseToJsonElement(stdout).jsonArray.forEach { secret ->
                val key = secret.jsonObject["key"]!!.jsonPrimitive.content
                val value = secret.jsonObject["value"]!!.jsonPrimitive.content

                LOGGER.debug("Found $key in BWS")

                put(key, value)
            }
        } catch (ex: Exception) {
            LOGGER.error("There was an issue loading secrets. Please check BWS.", ex)
        }
    }
}

/** Retrieve an environment variable from Bitwarden, fallback to System if it's not there. */
fun env(name: String): String? = bwsEnv[name] ?: System.getenv(name)

/** Parse [args] and change based on what's included. */
fun parseArgs(args: Array<String>) {
    // debug stuff
    args.forEach { arg ->
        when {
            // generate a token for a given user ID
            arg.startsWith("--gen-token=") -> {
                val userID = arg.removePrefix("--gen-token=")

                LOGGER.info(
                    "Generated Token: {}",
                    app.burrow.features.account.Authorization.generateToken(userID),
                )
            }

            // change frontend folder
            arg.startsWith("--use-frontend=") -> {
                FRONTEND_DIR = arg.removePrefix("--use-frontend=")

                LOGGER.info("Using frontend: {}", FRONTEND_DIR)
            }

            // override port
            arg.startsWith("--use-port=") -> {
                PORT = arg.removePrefix("--use-port=").toInt()
            }
        }
    }
}
