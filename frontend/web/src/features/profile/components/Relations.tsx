import useUser from "@features/auth/hooks/useUser.ts"
import type { UserResponse } from "@features/profile/profile.model.ts"
import { Button } from "@umnburrow/core"
import {
    FOLLOWERS_VIEW,
    FOLLOWING_VIEW
} from "@features/profile/profile.api.ts"
import useRelations from "@features/profile/hooks/useRelations.ts"

/**
 * {@see Relations}
 */
type RelationsProps = {
    data: UserResponse
}

/**
 * View the followers and following for a user on a profile.
 *
 * @see Profile.view.tsx
 */
export default function Relations({ data }: RelationsProps) {
    const rel = useRelations()
    const user = useUser()

    // not viewing their own profile
    if (user?.id !== data.user.id) {
        return (
            <div className="text-text/80 mt-1 text-sm">
                <span>
                    {data.following.followers} follower
                    {data.following.followers === 1 ? "" : "s"}
                </span>
                <span className="mx-2 opacity-60">•</span>
                <span>{data.following.following} following</span>
            </div>
        )
    }

    // viewing their own profile
    return (
        <div className="text-text/80 mt-1 text-sm">
            <Button color="LINK" onClick={() => rel(FOLLOWERS_VIEW)}>
                {data.following.followers} follower
                {data.following.followers === 1 ? "" : "s"}
            </Button>
            <span className="opacity-60">•</span>{" "}
            <Button color="LINK" onClick={() => rel(FOLLOWING_VIEW)}>
                {data.following.following} following
            </Button>
        </div>
    )
}
