package app.burrow

const val PAGE_SIZE = 20

/** If [condition], do [expr] inline. */
inline fun <K> K.doIf(condition: Boolean, crossinline expr: K.() -> K): K {
    return if (condition) expr(this) else this
}
