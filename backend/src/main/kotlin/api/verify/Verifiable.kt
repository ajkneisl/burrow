package app.burrow.api.verify

import kotlin.collections.mapValues
import kotlin.reflect.KClass
import kotlin.reflect.full.findAnnotation
import kotlin.reflect.full.primaryConstructor
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.booleanOrNull
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.longOrNull

/** Marks a data class as verifiable using the specified [Verifier] class. */
@Target(AnnotationTarget.CLASS)
@Retention(AnnotationRetention.RUNTIME)
annotation class Verifiable(val with: KClass<out Verifier<*>>)

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

/**
 * Convert a [JsonElement] to a Kotlin primitive value ([String], [Long], [Double], [Boolean], or
 * null).
 */
fun JsonElement.toKotlinValue(): Any? {
    return try {
        when (this) {
            is JsonArray ->
                (toList() as List<Any>).map { value -> (value as JsonElement).toKotlinValue() }
            is JsonObject ->
                (toMap() as Map<String, Any>).mapValues { (_, value) ->
                    (value as JsonElement).toKotlinValue()
                }

            is JsonPrimitive ->
                if (isString) content else booleanOrNull ?: longOrNull ?: doubleOrNull ?: content
        }
    } catch (_: Exception) {
        null
    }
}
