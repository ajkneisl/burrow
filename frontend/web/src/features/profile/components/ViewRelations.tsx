import { Modal } from "@umnburrow/core"
import { useQuery } from "@tanstack/react-query"
import MyFriend from "./MyFriend"
import useToken from "@features/auth/hooks/useToken.ts"
import { useAtom } from "jotai"
import {
    isRelationsVisible,
    relationType
} from "@features/profile/profile.atom.ts"
import type { Relation } from "@features/auth/user.types.ts"
import { getRelations } from "@features/auth/user.api.ts"

/**
 * View a certain type of relation, like friends, followers, following.
 *
 * @see relationType
 * @see isRelationsVisible
 */
export default function ViewRelations() {
    const auth = useToken()

    const [relation] = useAtom(relationType)
    const [isOpen, setOpen] = useAtom(isRelationsVisible)

    // fetch the relatio
    const { data, isLoading, isError } = useQuery<Relation[]>({
        queryKey: [relation?.key],
        enabled: isOpen && auth !== null,
        queryFn: () => getRelations(auth!, relation?.key ?? "friends") ?? []
    })

    if (!isOpen) return null

    return (
        <Modal
            title={relation?.title ?? ""}
            open={isOpen}
            onClose={() => setOpen(false)}
            aria-labelledby="friends-title"
        >
            <div className="w-full max-w-lg rounded-xl">
                {/* Body */}
                <div className="bg-background max-h-[70vh] overflow-y-auto rounded-b-xl p-3">
                    {isLoading && (
                        <div className="text-foreground/70 flex items-center justify-center py-10">
                            Loading…
                        </div>
                    )}

                    {isError && (
                        <div className="text-error py-10 text-center">
                            Failed to load friends.
                        </div>
                    )}

                    {!isLoading && !isError && (!data || data.length === 0) && (
                        <div className="text-foreground/70 py-10 text-center">
                            You don't have any friends yet.
                        </div>
                    )}

                    {!isLoading && !isError && data && data.length > 0 && (
                        <ul className="space-y-2">
                            {data.map((friend) => (
                                <MyFriend
                                    key={friend.userID}
                                    friend={friend}
                                    inModal={true}
                                />
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </Modal>
    )
}
