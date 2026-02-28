package app.burrow.api.verify

/** Base check with access to the value and error list. */
open class PropertyCheck<V>(val value: V, val errors: MutableList<String>) {
    /** Add an error if [condition] is true. */
    fun errorIf(condition: Boolean, message: String) {
        if (condition) errors += message
    }

    /** Add an error if [condition] returns true for the value. */
    fun errorIf(message: String, condition: (V) -> Boolean) {
        if (condition(value)) errors += message
    }

    /** Require a condition to be true. */
    fun require(message: String, condition: (V) -> Boolean) {
        if (!condition(value)) errors += message
    }
}
