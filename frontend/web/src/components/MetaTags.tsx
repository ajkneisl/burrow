import { Helmet } from "react-helmet"
import { useAtomValue } from "jotai"
import { metaTagsAtom } from "@api/meta.atom.ts"

/**
 * MetaTags component for injecting SEO meta tags into the page.
 * Replicates the functionality from Meta.kt on the backend.
 * Reads meta tag values from the global metaTagsAtom.
 *
 * Use the useMetaTags hook in page components to update the meta tags.
 */
export default function MetaTags() {
    const { title, description, image, url } = useAtomValue(metaTagsAtom)

    return (
        <Helmet>
            {/* Title tags */}
            <title>{title}</title>
            <meta property="og:title" content={title} />
            <meta name="twitter:title" content={title} />

            {/* Description tags */}
            <meta name="description" content={description} />
            <meta property="og:description" content={description} />
            <meta name="twitter:description" content={description} />

            {/* Image tags */}
            <meta property="og:image" content={image} />
            <meta name="twitter:image" content={image} />
            <meta name="twitter:card" content="summary_large_image" />

            {/* URL tag */}
            <meta property="og:url" content={url} />
        </Helmet>
    )
}
