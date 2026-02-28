package app.burrow.features.clubs.models.enums

import kotlinx.serialization.Serializable

/**
 * A link that a club may have.
 *
 * @param verifier Verify that a link for the given type is valid.
 */
@Serializable
enum class ClubLink(
    val verifier: (String) -> Boolean
) {
    INSTAGRAM({ handle ->
        handle.length <= 30 && INSTA_REGEX.matches(handle)
    }),

    X({ handle ->
        handle.length <= 15 && X_REGEX.matches(handle)
    }),

    WEBSITE({ url ->
        url.length <= 200 && URL_REGEX.matches(url)
    }),

    LINKED_IN({ handle ->
        handle.length <= 64 && LINKED_IN_REGEX.matches(handle)
    });

    companion object {
        private val INSTA_REGEX = Regex("^@?[A-Za-z0-9._]+$")
        private val X_REGEX = Regex("^@?[A-Za-z0-9_]+$")
        private val URL_REGEX = Regex("""^https?://[\w\-]+(\.[\w\-]+)+(/\S*)?$""")
        private val LINKED_IN_REGEX = Regex("^[A-Za-z0-9\\-]+$")
    }
}
