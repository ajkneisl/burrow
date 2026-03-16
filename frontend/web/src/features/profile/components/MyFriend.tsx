import type { Relation } from "@features/auth/user.types.ts"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { useNavigate } from "react-router"
import { useAtom } from "jotai"
import { isRelationsVisible } from "@features/profile/profile.atom.ts"
import { ListItem } from "@umnburrow/core"

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
        <ListItem
            onClick={viewFriend}
            leading={
                <ProfilePicture
                    name={friend.name}
                    userID={friend.userID}
                    size={"sm"}
                />
            }
            title={friend.name}
        />
    )
}
