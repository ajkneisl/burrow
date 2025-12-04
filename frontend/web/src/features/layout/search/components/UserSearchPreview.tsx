import { useNavigate } from "react-router"
import clsx from "clsx"
import type { Profile } from "@features/profile/profile.model.ts"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"

/**
 * {@link UserSearchPreview}
 */
type UserPreviewProps = {
    userID: string
    username: string
    profile: Profile
    onClick: () => void
}

/**
 * A preview of a user search result.
 *
 * @param userID The user's ID.
 * @param username The user's username.
 * @param profile The user's profile.
 * @param onClick When the user is clicked (close search).
 *
 * @author AJ Kneisl
 */
export default function UserSearchPreview({
    userID,
    username,
    profile,
    onClick
}: UserPreviewProps) {
    const nav = useNavigate()

    return (
        <button
            type="button"
            onClick={() => {
                nav(`/user/${username}`)
                onClick()
            }}
            className={clsx(
                "flex w-full flex-row items-center gap-3 px-3 py-2 text-left",
                "bg-hero/20 text-text hover:bg-hero/40 transition-all"
            )}
        >
            <ProfilePicture name={profile.name} userID={userID} size="sm" />

            <div className="flex min-w-0 flex-col">
                <div className="text-text truncate text-sm font-medium">
                    {profile.name}
                </div>

                <div className="text-text/60 truncate text-xs">
                    @{username}
                    {profile.major && (
                        <span className="text-text/40"> · {profile.major}</span>
                    )}
                </div>
            </div>
        </button>
    )
}
