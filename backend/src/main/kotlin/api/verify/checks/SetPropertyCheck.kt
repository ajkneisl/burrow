package app.burrow.api.verify.checks

import app.burrow.api.verify.PropertyCheck

/** Checks available for [Set] properties. */
class SetPropertyCheck<E>(value: Set<E>, errors: MutableList<String>) :
    PropertyCheck<Set<E>>(value, errors) {

    /** Verify the set size is at most [max]. */
    fun maxSize(max: Int, message: String) {
        if (value.size > max) errors += message
    }

    /** Verify the set size is within [range]. */
    fun sizeIn(range: IntRange, message: String) {
        if (value.size !in range) errors += message
    }

    /** Verify each element passes [check]. */
    suspend fun each(check: suspend (element: E) -> String?) {
        value.forEach { element -> check(element)?.let { errors += it } }
    }
}