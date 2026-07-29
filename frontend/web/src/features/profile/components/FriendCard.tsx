import type { Relation } from "@features/auth/user.types.ts"
import { useNavigate } from "react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { unFollowUser } from "@features/profile/profile.api.ts"
import toast from "react-hot-toast"
import { Card, Dropdown, DropdownItem } from "@umnburrow/core"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { Flag, MoreVertical, UserMinus } from "lucide-react"

/**
 * Individual friend.
 *
 * @author AJ Kneisl
 */
export default function FriendCard({ friend }: { friend: Relation }) {
    const nav = useNavigate()
    const queryClient = useQueryClient()

    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownBtnRef = useRef<HTMLButtonElement>(null)

    const unfollowMutation = useMutation({
        mutationFn: () => unFollowUser(friend.userID),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["friends"] })
            toast.success(`Unfollowed ${friend.name}`)
        },
        onError: () => {
            toast.error("Failed to unfollow user")
        }
    })

    return (
        <Card
            className="relative cursor-pointer p-4 transition-shadow hover:shadow-lg"
            onClick={() => nav(`/user/${friend.username}`)}
        >
            {/* three dots menu */}
            <div
                className="absolute top-3 right-3"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    ref={dropdownBtnRef}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="rounded-full p-1.5 text-text/40 transition-colors hover:bg-text/10 hover:text-text"
                >
                    <MoreVertical className="size-4" />
                </button>

                <Dropdown
                    open={dropdownOpen}
                    onClose={() => setDropdownOpen(false)}
                    btnRef={dropdownBtnRef}
                    align="end"
                >
                    <DropdownItem
                        label="Report"
                        rightIcon={<Flag className="size-4" />}
                        onSelect={() => {
                            setDropdownOpen(false)
                        }}
                    />

                    <DropdownItem
                        label="Unfollow"
                        rightIcon={<UserMinus className="size-4" />}
                        onSelect={() => {
                            setDropdownOpen(false)
                            unfollowMutation.mutate()
                        }}
                    />
                </Dropdown>
            </div>

            <div className="flex gap-4">
                {/* profile picture */}
                <div className="flex-shrink-0">
                    <ProfilePicture
                        name={friend.name}
                        userID={friend.userID}
                        size="responsive"
                    />
                </div>

                {/* user info */}
                <div className="flex flex-1 flex-col gap-3">
                    {/* name & username*/}
                    <div>
                        <h3 className="text-sm font-semibold text-text md:text-base">
                            {friend.name}
                        </h3>

                        <p className="text-xs text-text/60 md:text-sm">
                            @{friend.username}
                        </p>
                    </div>

                    {/* friends since */}
                    {friend.friendsAt && (
                        <p className="text-xs text-text/50">
                            Friends since{" "}
                            {new Date(friend.friendsAt).toLocaleDateString(
                                "en-US",
                                { month: "long", year: "numeric" }
                            )}
                        </p>
                    )}
                </div>
            </div>
        </Card>
    )
}
