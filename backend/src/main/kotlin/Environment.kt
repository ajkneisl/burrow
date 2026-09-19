package app.burrow

import java.util.Properties
import kotlin.system.exitProcess
import software.amazon.awssdk.services.ssm.SsmClient
import software.amazon.awssdk.services.ssm.model.GetParametersByPathRequest

/**
 * secrets from AWS Systems Manager Parameter Store.
 *
 * every parameter under `PARAMETER_STORE_PATH` (ex: `/burrow/prod`) is loaded, keyed by its name
 * relative to that path. credentials come from the default AWS provider chain.
 */
private val parameterStoreEnv by lazy {
    hashMapOf<String, String>().apply {
        val path = System.getenv("PARAMETER_STORE_PATH")?.trimEnd('/')

        if (path.isNullOrBlank()) {
            LOGGER.debug("PARAMETER_STORE_PATH not set, skipping Parameter Store")
            return@apply
        }

        LOGGER.debug("Loading secrets from Parameter Store at {}", path)

        try {
            SsmClient.create().use { ssm ->
                var nextToken: String? = null

                do {
                    val response =
                        ssm.getParametersByPath(
                            GetParametersByPathRequest.builder()
                                .path(path)
                                .recursive(true)
                                .withDecryption(true)
                                .nextToken(nextToken)
                                .build()
                        )

                    response.parameters().forEach { parameter ->
                        put(parameter.name().removePrefix("$path/"), parameter.value())
                    }

                    nextToken = response.nextToken()
                } while (nextToken != null)
            }

            LOGGER.debug("loaded {} secret(s) from Parameter Store", size)
        } catch (ex: Exception) {
            LOGGER.error("There was an issue loading secrets. Please check Parameter Store.", ex)
        }
    }
}

/** Retrieve an environment variable from Parameter Store, fallback to System if it's not there. */
fun env(name: String): String? = parameterStoreEnv[name] ?: System.getenv(name)

/** the version from build.gradle.kts, written into version.properties at build time. */
private val burrowVersion by lazy {
    object {}.javaClass.getResourceAsStream("/version.properties")?.use { stream ->
        Properties().apply { load(stream) }.getProperty("version")
    } ?: "unknown"
}

/** Retrieve the current version of Burrow. */
fun getVersion(): String = burrowVersion

val STAGE =
    try {
        Stage.valueOf(env("STAGE") ?: "DEV")
    } catch (_: Exception) {
        LOGGER.error("[FATAL] Invalid value for stage.")
        exitProcess(-1)
    }

enum class Stage {
    PROD,
    STAGING,
    DEV,
}

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
