package app.burrow.api.verify

import app.burrow.api.verify.checks.IntPropertyCheck
import app.burrow.api.verify.checks.ListPropertyCheck
import app.burrow.api.verify.checks.LongPropertyCheck
import app.burrow.api.verify.checks.MapPropertyCheck
import app.burrow.api.verify.checks.SetPropertyCheck
import app.burrow.api.verify.checks.StringPropertyCheck
import kotlin.reflect.KProperty1

/** Scope for defining verification rules on an instance of [T]. */
open class VerificationScope<T : Any>(private val _instance: T?) {
    val instance: T
        get() = _instance!!

    val errors = mutableListOf<String>()

    /**
     * Returns true if the given property should be checked. Always true for instance-based scope.
     */
    protected open fun shouldCheck(property: KProperty1<T, *>): Boolean = true

    /** Resolve the value for a property. By default reads from the instance. */
    protected open fun <V> resolveValue(property: KProperty1<T, V>): V = property.get(instance)

    /**
     * Run a block, silently skipping rules that access [instance] when no instance is available
     * (e.g. single-field verification).
     */
    protected open suspend fun <C> runBlock(check: C, block: suspend C.() -> Unit) {
        check.block()
    }

    /** Define verification rules for a String property. */
    suspend operator fun KProperty1<T, String>.invoke(
        block: suspend StringPropertyCheck.() -> Unit
    ) {
        if (!shouldCheck(this)) return
        val value = resolveValue(this)
        val check = StringPropertyCheck(value, errors)
        runBlock(check, block)
    }

    /** Define verification rules for an Int property. */
    @JvmName("invokeInt")
    suspend operator fun KProperty1<T, Int>.invoke(block: suspend IntPropertyCheck.() -> Unit) {
        if (!shouldCheck(this)) return
        val value = resolveValue(this)
        val check = IntPropertyCheck(value, errors)
        runBlock(check, block)
    }

    /** Define verification rules for a Long property. */
    @JvmName("invokeLong")
    suspend operator fun KProperty1<T, Long>.invoke(block: suspend LongPropertyCheck.() -> Unit) {
        if (!shouldCheck(this)) return
        val value = resolveValue(this)
        val check = LongPropertyCheck(value, errors)
        runBlock(check, block)
    }

    /** Define verification rules for a List property. */
    @JvmName("invokeList")
    suspend operator fun <E> KProperty1<T, List<E>>.invoke(
        block: suspend ListPropertyCheck<E>.() -> Unit
    ) {
        if (!shouldCheck(this)) return
        val value = resolveValue(this)
        val check = ListPropertyCheck(value, errors)
        runBlock(check, block)
    }

    /** Define verification rules for a Map property. */
    @JvmName("invokeMap")
    suspend operator fun <E, R> KProperty1<T, Map<E, R>>.invoke(
        block: suspend MapPropertyCheck<E, R>.() -> Unit
    ) {
        if (!shouldCheck(this)) return
        val value = resolveValue(this)
        val check = MapPropertyCheck(value, errors)
        runBlock(check, block)
    }

    /** Define verification rules for a Set property. */
    @JvmName("invokeSet")
    suspend operator fun <E> KProperty1<T, Set<E>>.invoke(
        block: suspend SetPropertyCheck<E>.() -> Unit
    ) {
        if (!shouldCheck(this)) return
        val value = resolveValue(this)
        val check = SetPropertyCheck(value, errors)
        runBlock(check, block)
    }

    /**
     * Define verification rules for any property type via a named function (avoids overload
     * ambiguity).
     */
    suspend fun <V> check(property: KProperty1<T, V>, block: suspend PropertyCheck<V>.() -> Unit) {
        if (!shouldCheck(property)) return
        val value = resolveValue(property)
        val check = PropertyCheck(value, errors)
        runBlock(check, block)
    }

    /** Add a custom error directly. */
    fun error(message: String) {
        errors += message
    }

    /** Add an error conditionally. */
    fun errorIf(condition: Boolean, message: String) {
        if (condition) errors += message
    }
}
