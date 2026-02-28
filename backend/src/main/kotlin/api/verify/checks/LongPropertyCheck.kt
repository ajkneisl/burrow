package app.burrow.api.verify.checks

import app.burrow.api.verify.PropertyCheck

/** Checks available for [Long] properties. */
class LongPropertyCheck(value: Long, errors: MutableList<String>) :
    PropertyCheck<Long>(value, errors) {

    /** Verify the value is within [range]. */
    fun inRange(range: LongRange, message: String) {
        if (value !in range) errors += message
    }

    /** Verify the value is in the future (treating it as epoch millis). */
    fun inFuture(message: String) {
        if (value <= System.currentTimeMillis()) errors += message
    }

    /** Verify the value is after [other]. */
    fun after(other: Long, message: String) {
        if (value <= other) errors += message
    }
}