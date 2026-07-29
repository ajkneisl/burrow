import { useQuery } from "@tanstack/react-query"
import { getDiscoveredUsers, getRelations } from "@features/auth/user.api.ts"
import { Card } from "@umnburrow/core"
import { UserPlus } from "lucide-react"
import FriendCard from "@features/profile/components/FriendCard.tsx"
import DiscoveredUserCard from "@features/profile/components/DiscoveredUserCard.tsx"

/**
 * Friends page - displays user's friends and suggested connections
 *
 * @author AJ Kneisl
 */
export default function Friends() {
    // get friends
    const { data: friends, isLoading: loadingFriends } = useQuery({
        queryKey: ["friends"],
        queryFn: async () => await getRelations("friends")
    })

    // get discover page
    const { data: discoveredUsers, isLoading: loadingDiscovered } = useQuery({
        queryKey: ["discovered"],
        queryFn: async () => await getDiscoveredUsers()
    })

    return (
        <main className="min-h-screen">
            <section className="relative isolate">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {/* friends */}
                    <div className="mb-6">
                        <h1 className="mb-2 text-3xl font-bold text-text">
                            Friends
                        </h1>

                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-text/60">
                                {friends?.length || 0} friends
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            {loadingFriends ? (
                                // loading skeleton
                                <div className="space-y-4">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Card key={i} className="p-4">
                                            <div className="flex gap-4">
                                                <div className="size-16 animate-pulse rounded-full bg-text/10" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-5 w-32 animate-pulse rounded bg-text/10" />
                                                    <div className="h-4 w-24 animate-pulse rounded bg-text/10" />
                                                    <div className="h-3 w-40 animate-pulse rounded bg-text/10" />
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            ) : !friends || friends.length === 0 ? (
                                // no friends
                                <Card className="p-12 text-center">
                                    <UserPlus className="mx-auto mb-4 size-12 text-text/20" />

                                    <h3 className="mb-2 text-lg font-semibold text-text">
                                        No friends yet
                                    </h3>

                                    <p className="text-sm text-text/60">
                                        Start connecting with people to see them
                                        here
                                    </p>
                                </Card>
                            ) : (
                                // display friends
                                <div className="space-y-4">
                                    {friends.map((friend) => (
                                        <FriendCard
                                            key={friend.userID}
                                            friend={friend}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* discovered users */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-4 p-4">
                                <h2 className="mb-4 text-lg font-semibold text-text">
                                    Discover
                                </h2>

                                {loadingDiscovered ? (
                                    // loading skeleton
                                    <div className="space-y-3">
                                        {Array.from({ length: 3 }).map(
                                            (_, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-3"
                                                >
                                                    <div className="size-12 animate-pulse rounded-full bg-text/10" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-4 w-24 animate-pulse rounded bg-text/10" />
                                                        <div className="h-3 w-20 animate-pulse rounded bg-text/10" />
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                ) : !discoveredUsers ||
                                  discoveredUsers.length === 0 ? (
                                    // no discovered users
                                    <p className="text-center text-sm text-text/60">
                                        No suggestions available
                                    </p>
                                ) : (
                                    // display discovered
                                    <div className="space-y-3">
                                        {discoveredUsers.map((user) => (
                                            <DiscoveredUserCard
                                                key={user.userID}
                                                user={user}
                                            />
                                        ))}
                                    </div>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
