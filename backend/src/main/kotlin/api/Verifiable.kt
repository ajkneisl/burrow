package app.burrow.api

import kotlin.reflect.KClass
import kotlin.reflect.KProperty1
import kotlin.reflect.full.findAnnotation
import kotlin.reflect.full.primaryConstructor

/**
 * Marks a data class as verifiable using the specified [Verifier] class.
 *
 * Usage:
 * ```
 * @Verifiable(with = SubmittedClubVerifier::class)
 * data class SubmittedClub(val name: String, val description: String)
 * ```
 */
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class Verifiable(val with: KClass<out Verifier<*>>)

/**
 * Base class for verifying data class properties. Subclass this and override [rules] to define
 * verification rules for each property. All rules are suspendable, so database queries and other
 * async operations can be used directly.
 *
 * Usage:
 * ```
 * class SubmittedClubVerifier : Verifier<SubmittedClub>() {
 *     override suspend fun VerificationScope<SubmittedClub>.rules() {
 *         SubmittedClub::name {
 *             lengthIn(1..32, "Name must be between 1 and 32 characters.")
 *             matches(Regex("^[A-Za-z0-9-]+$"), "Name must only contain letters, numbers, and hyphens.")
 *         }
 *
 *         SubmittedClub::description {
 *             maxLength(1024, "Description must be 1024 characters or fewer.")
 *         }
 *     }
 * }
 * ```
 */
abstract class Verifier<T : Any> {
    abstract suspend fun VerificationScope<T>.rules()

    suspend fun verify(instance: T): List<String> {
        val scope = VerificationScope(instance)
        scope.rules()
        return scope.errors.toList()
    }

    /**
     * Verify a single field by [fieldName] with the given [value], without needing a full instance.
     *
     * Usage: `verifier.verifyField("name", "this is a name")`
     */
    suspend fun verifyField(fieldName: String, value: Any?): List<String> {
        val scope = FieldVerificationScope<T>(fieldName, value)
        scope.rules()
        return scope.errors.toList()
    }
}

/** Scope for defining verification rules on an instance of [T]. */
open class VerificationScope<T : Any>(private val _instance: T?) {
    val instance: T get() = _instance!!
    val errors = mutableListOf<String>()

    /**
     * Returns true if the given property should be checked. Always true for instance-based scope.
     */
    protected open fun shouldCheck(property: KProperty1<T, *>): Boolean = true

    /** Resolve the value for a property. By default reads from the instance. */
    protected open fun <V> resolveValue(property: KProperty1<T, V>): V = property.get(instance)

    /** Define verification rules for a String property. */
    suspend operator fun KProperty1<T, String>.invoke(
        block: suspend StringPropertyCheck.() -> Unit
    ) {
        if (!shouldCheck(this)) return
        val value = resolveValue(this)
        val check = StringPropertyCheck(value, errors)
        check.block()
    }

    /** Define verification rules for an Int property. */
    @JvmName("invokeInt")
    suspend operator fun KProperty1<T, Int>.invoke(block: suspend IntPropertyCheck.() -> Unit) {
        if (!shouldCheck(this)) return
        val value = resolveValue(this)
        val check = IntPropertyCheck(value, errors)
        check.block()
    }

    /** Define verification rules for a Long property. */
    @JvmName("invokeLong")
    suspend operator fun KProperty1<T, Long>.invoke(block: suspend LongPropertyCheck.() -> Unit) {
        if (!shouldCheck(this)) return
        val value = resolveValue(this)
        val check = LongPropertyCheck(value, errors)
        check.block()
    }

    /** Define verification rules for a List property. */
    @JvmName("invokeList")
    suspend operator fun <E> KProperty1<T, List<E>>.invoke(
        block: suspend ListPropertyCheck<E>.() -> Unit
    ) {
        if (!shouldCheck(this)) return
        val value = resolveValue(this)
        val check = ListPropertyCheck(value, errors)
        check.block()
    }

    /** Define verification rules for a Set property. */
    @JvmName("invokeSet")
    suspend operator fun <E> KProperty1<T, Set<E>>.invoke(
        block: suspend SetPropertyCheck<E>.() -> Unit
    ) {
        if (!shouldCheck(this)) return
        val value = resolveValue(this)
        val check = SetPropertyCheck(value, errors)
        check.block()
    }

    /**
     * Define verification rules for any property type via a named function (avoids overload
     * ambiguity).
     */
    suspend fun <V> check(property: KProperty1<T, V>, block: suspend PropertyCheck<V>.() -> Unit) {
        if (!shouldCheck(property)) return
        val value = resolveValue(property)
        val check = PropertyCheck(value, errors)
        check.block()
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

/**
 * A verification scope that checks a single field by name using a provided value, without requiring
 * a full instance of [T].
 */
@Suppress("UNCHECKED_CAST")
class FieldVerificationScope<T : Any>(private val fieldName: String, private val fieldValue: Any?) :
    VerificationScope<T>(null) {

    override fun shouldCheck(property: KProperty1<T, *>): Boolean = property.name == fieldName

    override fun <V> resolveValue(property: KProperty1<T, V>): V = fieldValue as V
}

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

/**
 * Verify this instance using the [Verifier] specified in its [Verifiable] annotation.
 *
 * @return A list of error messages. Empty if verification passed.
 */
suspend fun <T : Any> T.verify(): List<String> {
    val annotation =
        this::class.findAnnotation<Verifiable>()
            ?: throw IllegalStateException(
                "${this::class.simpleName} is not annotated with @Verifiable"
            )

    @Suppress("UNCHECKED_CAST")
    val verifier =
        annotation.with.primaryConstructor?.call() as? Verifier<T>
            ?: throw IllegalStateException(
                "Verifier ${annotation.with.simpleName} must have a no-arg constructor"
            )

    return verifier.verify(this)
}

/**
 * Verify a single field by [fieldName] with the given [value] using the [Verifier] specified in the
 * [Verifiable] annotation of [T], without needing a full instance.
 *
 * Usage: `verifyField<SubmittedClub>("name", "this is a name")`
 *
 * @return A list of error messages. Empty if verification passed.
 */
suspend inline fun <reified T : Any> verifyField(fieldName: String, value: Any?): List<String> {
    val annotation =
        T::class.findAnnotation<Verifiable>()
            ?: throw IllegalStateException(
                "${T::class.simpleName} is not annotated with @Verifiable"
            )

    @Suppress("UNCHECKED_CAST")
    val verifier =
        annotation.with.primaryConstructor?.call() as? Verifier<T>
            ?: throw IllegalStateException(
                "Verifier ${annotation.with.simpleName} must have a no-arg constructor"
            )

    return verifier.verifyField(fieldName, value)
}
