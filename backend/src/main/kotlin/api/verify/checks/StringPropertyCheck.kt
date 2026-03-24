package app.burrow.api.verify.checks

import app.burrow.api.verify.PropertyCheck

/** Checks available for [String] properties. */
class StringPropertyCheck(value: String, errors: MutableList<String>) :
    PropertyCheck<String>(value, errors) {

    /** Verify the string length is within [range]. */
    fun lengthIn(range: IntRange, message: String) {
        if (value.length !in range) errors += message
    }

    /** Verify the trimmed string length is within [range]. */
    fun trimmedLengthIn(range: IntRange, message: String) {
        if (value.trim().length !in range) errors += message
    }

    /** Verify the string is at most [max] characters. */
    fun maxLength(max: Int, message: String) {
        if (value.length > max) errors += message
    }

    /** Verify the string matches [regex]. */
    fun matches(regex: Regex, message: String) {
        if (!regex.matches(value)) errors += message
    }

    /** Verify the string is not blank. */
    fun notBlank(message: String) {
        if (value.isBlank()) errors += message
    }
}