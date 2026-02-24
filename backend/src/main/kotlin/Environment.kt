package app.burrow

/**
 * secrets from Bitwarden Secret Manager.
 *
 * please refer to Bitwarden's docs on the secret manager cli for this :)
 */
private val bwsEnv by lazy {
    hashMapOf<String, String>().apply {
        try {
            ProcessBuilder(
                    "bws",
                    "secret",
                    "list",
                    "--output",
                    "env",
                    "--access-token",
                    System.getenv("BWS_ACCESS_TOKEN"),
                )
                .start()
                .inputStream
                .bufferedReader()
                .forEachLine { line ->
                    val spl = line.split("=")

                    val varName = spl[0]
                    val varValue = spl[1].removeSurrounding("\"")

                    LOGGER.debug("Found $varName in BWS")

                    put(varName, varValue)
                }
        } catch (ex: Exception) {
            ex.printStackTrace()
            LOGGER.error("There was an issue loading secrets. Please check BWS.")
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
