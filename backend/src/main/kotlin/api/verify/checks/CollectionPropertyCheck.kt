package app.burrow.api.verify.checks

import app.burrow.api.verify.PropertyCheck
import kotlin.collections.Collection

/** Checks available for [CollectionPropertyCheck] properties. */
class CollectionPropertyCheck<E>(value: Collection<E>, errors: MutableList<String>) :
    PropertyCheck<Collection<E>>(value, errors) {

    /** Verify the set size is at most [max]. */
    fun maxSize(max: Int, message: String) {
        if (value.size > max) errors += message
    }

    /** Verify the set size is within [range]. */
    fun sizeIn(range: IntRange, message: String) {
        if (value.size !in range) errors += message
    }

    /** Verify each element passes [check]. */
    suspend fun each(check: suspend (index: Int, element: E) -> String?) {
        value.forEachIndexed { index, element -> check(index, element)?.let { errors += it } }
    }
}
