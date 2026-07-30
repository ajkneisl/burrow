import type { UserResponse } from "@umnburrow/core/api"
import useUser from "@features/auth/hooks/useUser.ts"
import { Button } from "@umnburrow/core"
import { FOLLOWERS_VIEW, FOLLOWING_VIEW } from "@features/profile/profile.util.ts"
import useRelations from "@features/profile/hooks/useRelations.ts"

/**
 * {@see Relations}
 */
type RelationsProps = {
    data: UserResponse
    isFriends: boolean
}

/**
 * View the followers and following for a user on a profile.
 *
 * @see Profile.view.tsx
 */
export default function Relations({ data, isFriends }: RelationsProps) {
    const rel = useRelations()
    const user = useUser()

    // not viewing their own profile or friends
    if (user?.id !== data.user.id && !isFriends) {
        return (
            <div className="mt-1 text-sm text-text/80">
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
        <div className="mt-1 text-sm text-text/80">
            <Button
                color="LINK"
                onClick={() => rel(FOLLOWERS_VIEW(data.user.id))}
            >
                {data.following.followers} follower
                {data.following.followers === 1 ? "" : "s"}
            </Button>
            <span className="mx-2 opacity-60">•</span>{" "}
            <Button
                color="LINK"
                onClick={() => rel(FOLLOWING_VIEW(data.user.id))}
            >
                {data.following.following} following
            </Button>
        </div>
    )
}
