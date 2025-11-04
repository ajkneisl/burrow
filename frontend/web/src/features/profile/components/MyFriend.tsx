import type { Relation } from "@features/auth/user.types.ts"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { useNavigate } from "react-router"
import { useAtom } from "jotai"
import { isRelationsVisible } from "@features/profile/profile.atom.ts"

/**
 * {@see MyFriend}
 */
type MyFriendProps = {
    friend: Relation
    inModal?: boolean
}

/**
 * A friend representation on a profile.
 * @param friend The friend.
 * @param inModal If this is in the {@see ViewRelations} modal.
 * @see MyProfile
 */
export default function MyFriend({ friend, inModal }: MyFriendProps) {
    const nav = useNavigate()
    const [, setOpen] = useAtom(isRelationsVisible)

    function viewFriend() {
        nav(`/user/${friend.username}`)

        // if in modal, close it
        if (inModal) {
            setOpen(false)
        }
    }

    return (
        <li
            onClick={() => viewFriend()}
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
