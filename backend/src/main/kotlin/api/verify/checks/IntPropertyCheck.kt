package app.burrow.api.verify.checks

import app.burrow.api.verify.PropertyCheck

/** Checks available for [Int] properties. */
class IntPropertyCheck(value: Int, errors: MutableList<String>) :
    PropertyCheck<Int>(value, errors) {

    /** Verify the value is within [range]. */
    fun inRange(range: IntRange, message: String) {
        if (value !in range) errors += message
    }

    /** Verify the value is at least [min]. */
    fun min(min: Int, message: String) {
        if (value < min) errors += message
    }

    /** Verify the value is at most [max]. */
    fun max(max: Int, message: String) {
        if (value > max) errors += message
    }
}