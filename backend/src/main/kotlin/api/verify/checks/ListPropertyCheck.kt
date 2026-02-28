package app.burrow.api.verify.checks

import app.burrow.api.verify.PropertyCheck

/** Checks available for [List] properties. */
class ListPropertyCheck<E>(value: List<E>, errors: MutableList<String>) :
    PropertyCheck<List<E>>(value, errors) {

    /** Verify the list size is at most [max]. */
    fun maxSize(max: Int, message: String) {
        if (value.size > max) errors += message
    }

    /** Verify the list size is within [range]. */
    fun sizeIn(range: IntRange, message: String) {
        if (value.size !in range) errors += message
    }

    /** Verify each element passes [check]. */
    suspend fun each(check: suspend (index: Int, element: E) -> String?) {
        value.forEachIndexed { idx, element -> check(idx, element)?.let { errors += it } }
    }
}
