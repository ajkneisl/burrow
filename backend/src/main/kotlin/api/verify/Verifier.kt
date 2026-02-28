package app.burrow.api.verify

/**
 * Base class for verifying data class properties. Subclass this and override [rules] to define
 * verification rules for each property. All rules are suspendable, so database queries and other
 * async operations can be used directly.
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