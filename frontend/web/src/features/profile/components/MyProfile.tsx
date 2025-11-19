import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { Badge, Card } from "@umnburrow/core"
import { Link } from "react-router"
import useUser from "@features/auth/hooks/useUser.ts"
import useProfile from "@features/auth/hooks/useProfile.ts"
import { useQuery } from "@tanstack/react-query"
import { getRelations } from "@features/auth/user.api.ts"
import { convertGraduationYear } from "@api/util.ts"
import MyFriend from "@features/profile/components/MyFriend.tsx"
import useRelations from "@features/profile/hooks/useRelations.ts"
import { FRIENDS_VIEW } from "@features/profile/profile.api.ts"

/**
 * A view of My Profile on the homepage.
 *
 * @author AJ Kneisl
 */
export default function MyProfile() {
    const user = useUser()
    const rel = useRelations()
    const profile = useProfile()

    const { data, isLoading } = useQuery({
        queryKey: ["friends"],
        queryFn: async () => await getRelations("friends")
    })

    return (
        <Card className="border-text/10 from-background/60 via-background/40 to-card mt-8 flex flex-col gap-5 rounded-xl border bg-gradient-to-br p-4 shadow-md transition-colors hover:shadow-lg">
            {/* header */}
            <div className="flex flex-row items-center justify-evenly gap-3">
                {/* profile / user loading */}
                {(!profile || !user) && (
                    <>
                        <div className="bg-text/10 size-24 animate-pulse rounded-full" />
                        <div className="min-w-0 flex-1">
                            <div className="bg-text/10 mx-auto mb-2 h-5 w-30 animate-pulse rounded" />
                            <div className="flex flex-col items-center gap-2">
                                <Badge>
                                    <div className="bg-text/10 h-5 w-16 animate-pulse rounded" />
                                </Badge>
                                <div className="bg-text/10 h-3 w-24 animate-pulse rounded" />
                            </div>
                        </div>
                    </>
                )}

                {/* profile view */}
                {profile && user && (
                    <>
                        <ProfilePicture
                            name={profile?.name}
                            userID={user?.id}
                            size={"lg"}
                            editable={true}
                        />

                        <div className="min-w-0">
                            <h1 className="figtree mb-1 truncate text-center text-lg leading-none font-semibold">
                                {profile?.name}
                            </h1>

                            <div className="flex flex-col items-center gap-4">
                                {profile.gradYear && (
                                    <Badge>
                                        {convertGraduationYear(
                                            profile.gradYear
                                        )}
                                    </Badge>
                                )}

                                <Link
                                    to={`/user/${user?.username}`}
                                    className="text-text/60 hover:text-text text-xs underline-offset-2 transition-all hover:underline"
                                >
                                    View profile
                                </Link>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="hidden flex-col gap-5 lg:flex">
                <div className="border-text/10 border-t" />

                {/* friends */}
                <section
                    aria-labelledby="friends-heading"
                    className="flex flex-col"
                >
                    <div className="flex flex-row items-center justify-between">
                        <h2
                            id="friends-heading"
                            className="text-text/60 figtree text-[11px] tracking-wider uppercase"
                        >
                            Friends
                        </h2>

                        <button
                            onClick={() => rel(FRIENDS_VIEW)}
                            className="text-text/60 hover:text-text/80 cursor-pointer text-xs hover:underline"
                        >
                            View all
                        </button>
                    </div>

                    <ul className="mt-2 space-y-2">
                        {!isLoading &&
                            data &&
                            data?.map((friend) => <MyFriend friend={friend} />)}

                        {/* friends skeleton */}
                        {(isLoading || !data) &&
                            Array.from({ length: 3 }).map((_, i) => (
                                <li
                                    key={i}
                                    className="bg-background/30 flex items-center gap-2 rounded-lg px-4 py-3"
                                >
                                    <div className="bg-text/10 size-8 animate-pulse rounded-full" />
                                    <div className="bg-text/10 h-3 w-32 animate-pulse rounded" />
                                </li>
                            ))}
                    </ul>
                </section>
            </div>
        </Card>
    )
}
