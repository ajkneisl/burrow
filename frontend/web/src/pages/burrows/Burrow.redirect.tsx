import {useParams} from "react-router"
;
import StandardBurrow from "@pages/burrows/StandardBurrow.view.tsx"
;
import NotFound from "@pages/NotFound.view.tsx"
;

/**
 * When visiting /:id, redirect to /burrow/:id
 *
 * @author AJ Kneisl
 */
export default function BurrowRedirect() {
    const { id } = useParams()

    // fits form /XXXXXXXX
    if (id && id.length === 8) return <StandardBurrow />

    return <NotFound />
}