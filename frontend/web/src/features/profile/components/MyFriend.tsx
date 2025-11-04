import type { Relation } from "@features/auth/user.types.ts"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { useNavigate } from "react-router"

/**
 * {@see MyFriend}
 */
type MyFriendProps = {
    friend: Relation
}

/**
 * A friend representation on a profile.
 * @param friend The friend.
 * @see MyProfile
 */
export default function MyFriend({ friend }: MyFriendProps) {
    const nav = useNavigate()

    return (
        <li
            onClick={() => nav(`/user/${friend.username}`)}
            className="bg-background/30 hover:bg-background/60 flex cursor-pointer items-center gap-2 rounded-lg px-4 py-3 transition-colors"
        >
            <ProfilePicture
                name={friend.name}
                userID={friend.userID}
                size={"sm"}
            />

            <span className="truncate">{friend.name}</span>
        </li>
    )
}
