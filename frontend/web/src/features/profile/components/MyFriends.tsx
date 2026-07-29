import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Users } from "lucide-react"
import { Card } from "@umnburrow/core"
import { getRelations } from "@features/auth/user.api.ts"
import MyFriend from "@features/profile/components/MyFriend.tsx"

/**
 * Sidebar widget showing the user's friends on the homepage.
 *
 * @author AJ Kneisl
 */
export default function MyFriends() {
    const nav = useNavigate()

    const { data, isLoading } = useQuery({
        queryKey: ["friends"],
        queryFn: async () => await getRelations("friends")
    })

    return (
        <Card className="flex flex-col gap-4 rounded-xl border border-text/10 p-4 shadow-md">
            <div className="flex items-center justify-between">
                <h2 className="figtree text-[11px] tracking-wider text-text/60 uppercase">
                    Friends
                </h2>

                <button
                    onClick={() => nav("/friends")}
                    className="cursor-pointer text-xs text-text/60 hover:text-text/80 hover:underline"
                >
                    View all
                </button>
            </div>

            <ul className="space-y-2">
                {/* friends list */}
                {!isLoading &&
                    data &&
                    data
                        .slice(0, 3)
                        .map((friend) => (
                            <MyFriend key={friend.userID} friend={friend} />
                        ))}

                {/* loading skeleton */}
                {(isLoading || !data) &&
                    Array.from({ length: 3 }).map((_, i) => (
                        <li
                            key={i}
                            className="flex items-center gap-2 rounded-lg bg-hero/80 px-4 py-3"
                        >
                            <div className="size-8 animate-pulse rounded-full bg-text/10" />
                            <div className="h-3 w-32 animate-pulse rounded bg-text/10" />
                        </li>
                    ))}

                {/* empty state */}
                {!isLoading && data && data.length === 0 && (
                    <li className="flex flex-col items-center gap-1 rounded-lg bg-background/30 px-4 py-6">
                        <Users className="size-6 text-text/30" />
                        <p className="text-sm text-text/40">No friends yet</p>
                    </li>
                )}
            </ul>
        </Card>
    )
}
