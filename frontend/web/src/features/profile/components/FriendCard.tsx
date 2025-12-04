import type { Relation } from "@features/auth/user.types.ts"
import { useNavigate } from "react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { unFollowUser } from "@features/profile/profile.api.ts"
import toast from "react-hot-toast"
import { Button, Card, Dropdown, DropdownItem } from "@umnburrow/core"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { MessageSquare, MoreVertical } from "lucide-react"

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
            className="cursor-pointer p-4 transition-shadow hover:shadow-lg"
            onClick={() => nav(`/user/${friend.username}`)}
        >
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
                        <h3 className="text-text text-sm font-semibold md:text-base">
                            {friend.name}
                        </h3>

                        <p className="text-text/60 text-xs md:text-sm">
                            @{friend.username}
                        </p>
                    </div>

                    {/* friends since */}
                    {friend.friendsAt && (
                        <p className="text-text/50 text-xs">
                            Friends since{" "}
                            {new Date(friend.friendsAt).toLocaleDateString(
                                "en-US",
                                { month: "long", year: "numeric" }
                            )}
                        </p>
                    )}

                    {/* actions buttons */}
                    <div className="flex items-center justify-between gap-2">
                        <Button
                            color="PRIMARY"
                            thin
                            onClick={(e) => {
                                e.stopPropagation()
                                toast.error("good morning")
                            }}
                        >
                            <MessageSquare className="h-4 w-4" />

                            <span className="hidden sm:inline">Message</span>
                        </Button>

                        {/* three dots menu */}
                        <div onClick={(e) => e.stopPropagation()}>
                            <Button
                                ref={dropdownBtnRef}
                                colors="border-text/20 text-text/60 hover:bg-background hover:text-text"
                                thin
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                <MoreVertical className="h-4 w-4" />
                            </Button>

                            <Dropdown
                                open={dropdownOpen}
                                onClose={() => setDropdownOpen(false)}
                                btnRef={dropdownBtnRef}
                                align="end"
                            >
                                {/* report */}
                                <DropdownItem
                                    label="Report"
                                    onSelect={() => {
                                        setDropdownOpen(false)
                                    }}
                                />

                                {/* unfollow */}
                                <DropdownItem
                                    label="Unfollow"
                                    onSelect={() => {
                                        setDropdownOpen(false)
                                        unfollowMutation.mutate()
                                    }}
                                />
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    )
}
