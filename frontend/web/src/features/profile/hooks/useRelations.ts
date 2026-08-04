import {
    isRelationsVisible,
    relationType
} from "@features/profile/profile.atom.ts"
import { useAtom } from "jotai"
import type { RelationView } from "@features/profile/profile.model.ts"
/**
 * A quick way to both open and instantiate a view into the relations modal.
 *
 * @see isRelationsVisible
 * @see relationType
 * @see ViewRelations
 */
export default function useRelations() {
    const [, setOpen] = useAtom(isRelationsVisible)
    const [, setRelation] = useAtom(relationType)

    return (relation: RelationView) => {
        setOpen(true)
        setRelation(relation)
    }
}
