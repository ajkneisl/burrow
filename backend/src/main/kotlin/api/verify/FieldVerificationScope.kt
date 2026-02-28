package app.burrow.api.verify

import kotlin.reflect.KProperty1

/**
 * A verification scope that checks a single field by name using a provided value, without requiring
 * a full instance of [T].
 */
@Suppress("UNCHECKED_CAST")
class FieldVerificationScope<T : Any>(private val fieldName: String, private val fieldValue: Any?) :
    VerificationScope<T>(null) {

    override fun shouldCheck(property: KProperty1<T, *>): Boolean = property.name == fieldName

    override fun <V> resolveValue(property: KProperty1<T, V>): V {
        if (fieldValue is String) {
            val coerced: Any? =
                when (property.returnType.classifier) {
                    Long::class -> fieldValue.toLongOrNull()
                    Int::class -> fieldValue.toIntOrNull()
                    Double::class -> fieldValue.toDoubleOrNull()
                    Boolean::class -> fieldValue.toBooleanStrictOrNull()
                    else -> fieldValue
                }
            return coerced as V
        }
        return fieldValue as V
    }

    override suspend fun <C> runBlock(check: C, block: suspend C.() -> Unit) {
        try {
            check.block()
        } catch (_: NullPointerException) {
            // Cross-field rules access `instance` which is null during single-field verification.
            // Silently skip these rules since they can't be evaluated without a full instance.
        } catch (_: ClassCastException) {
            // Map/enum keys from JSON are strings at runtime due to type erasure.
            // Silently skip these rules since they can't be evaluated without proper deserialization.
        }
    }
}