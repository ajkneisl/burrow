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
        <Card className="border-text/10 flex flex-col gap-4 rounded-xl border p-4 shadow-md">
            <div className="flex items-center justify-between">
                <h2 className="text-text/60 figtree text-[11px] tracking-wider uppercase">
                    Friends
                </h2>

                <button
                    onClick={() => nav("/friends")}
                    className="text-text/60 hover:text-text/80 cursor-pointer text-xs hover:underline"
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
                            className="bg-hero/80 flex items-center gap-2 rounded-lg px-4 py-3"
                        >
                            <div className="bg-text/10 size-8 animate-pulse rounded-full" />
                            <div className="bg-text/10 h-3 w-32 animate-pulse rounded" />
                        </li>
                    ))}

                {/* empty state */}
                {!isLoading && data && data.length === 0 && (
                    <li className="bg-background/30 flex flex-col items-center gap-1 rounded-lg px-4 py-6">
                        <Users className="text-text/30 h-6 w-6" />
                        <p className="text-text/40 text-sm">No friends yet</p>
                    </li>
                )}
            </ul>
        </Card>
    )
}
