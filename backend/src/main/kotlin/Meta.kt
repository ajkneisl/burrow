package app.burrow

/**
 * SEO attributes that can be injected into the frontend.
 *
 * @param title The title of the page.
 * @param image The image of the page.
 * @param url The URL of the page.
 * @parma description The description of the page.
 */
data class MetaTags(
    val title: String? = null,
    val description: String? = null,
    val image: String? = null,
    val url: String? = null,
)

/** Inject [metaTags] into [baseHtml] before <head>. */
fun injectMetaTags(baseHtml: String, metaTags: MetaTags): String {
    val metaTagsHtml = buildString {
        metaTags.title?.let {
            appendLine("    <meta property=\"og:title\" content=\"$it\" />")
            appendLine("    <meta name=\"twitter:title\" content=\"$it\" />")
            appendLine("    <title>$it</title>")
        }
        metaTags.description?.let {
            appendLine("    <meta name=\"description\" content=\"$it\" />")
            appendLine("    <meta property=\"og:description\" content=\"$it\" />")
            appendLine("    <meta name=\"twitter:description\" content=\"$it\" />")
        }
        metaTags.image?.let {
            appendLine("    <meta property=\"og:image\" content=\"$it\" />")
            appendLine("    <meta name=\"twitter:image\" content=\"$it\" />")
            appendLine("    <meta name=\"twitter:card\" content=\"summary_large_image\" />")
        }
        metaTags.url?.let { appendLine("    <meta property=\"og:url\" content=\"$it\" />") }
    }

    return baseHtml.replace("</head>", "$metaTagsHtml  </head>")
}
