import { useEffect } from "react"
import { useSetAtom } from "jotai"
import { defaultMetaTags, metaTagsAtom, type MetaTagsState } from "@features/layout/meta.atom.ts"

/**
 * Hook to set meta tags for SEO and social media sharing.
 * Automatically resets to default tags when the component unmounts.
 *
 * @param tags - The meta tags to set for this page
 *
 * @example
 * ```tsx
 * function ProfilePage() {
 *   useMetaTags({
 *     title: "John Doe on Burrow",
 *     description: "View John's profile",
 *     url: "https://umn.app/user/john"
 *   })
 *
 *   return <div>...</div>
 * }
 * ```
 */
export default function useMetaTags(tags: MetaTagsState) {
    const setMetaTags = useSetAtom(metaTagsAtom)

    useEffect(() => {
        setMetaTags(tags)

        return () => {
            setMetaTags(defaultMetaTags)
        }
    }, [tags.title, tags.description, tags.image, tags.url, setMetaTags, tags])
}
