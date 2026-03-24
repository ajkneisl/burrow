package app.burrow.api.verify.checks

import app.burrow.api.verify.PropertyCheck

class MapPropertyCheck<E, R>(value: Map<E, R>, errors: MutableList<String>) :
    PropertyCheck<Map<E, R>>(value, errors) {

    fun maxSize(max: Int, message: String) {
        if (value.size > max) errors += message
    }

    fun sizeIn(range: IntRange, message: String) {
        if (value.size !in range) errors += message
    }

    /**
     * Verify that all keys are valid enum values. Handles the case where keys are strings
     * at runtime (e.g. from JSON partial validation) by checking against enum names.
     */
    inline fun <reified K : Enum<K>> validKeys(message: String) {
        val validNames = enumValues<K>().map { it.name }.toSet()
        val invalid = value.keys.any { key ->
            when (key) {
                is Enum<*> -> key.name !in validNames
                is String -> key !in validNames
                else -> true
            }
        }
        if (invalid) errors += message
    }

    /**
     * Verify each entry passes [check], coercing string keys to enum values when needed.
     * Entries with keys that can't be coerced are skipped (use [validKeys] to catch those).
     */
    @Suppress("UNCHECKED_CAST")
    inline fun <reified K : Enum<K>> eachEntry(crossinline check: (key: K, value: R) -> String?) {
        for ((key, v) in value) {
            val typedKey: K = when (key) {
                is Enum<*> -> key as? K ?: continue
                is String -> try { enumValueOf<K>(key) } catch (_: IllegalArgumentException) { continue }
                else -> continue
            }
            check(typedKey, v)?.let { errors += it }
        }
    }

    /** Verify each entry passes [check]. */
    suspend fun each(check: suspend (element: Pair<E, R>) -> String?) {
        value.forEach { (key, v) -> check(key to v)?.let { errors += it } }
    }
}
