import { convertGraduationYear } from "@umnburrow/core/api"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { Badge, Card } from "@umnburrow/core"
import { Link } from "react-router"
import useUser from "@features/auth/hooks/useUser.ts"
import useProfile from "@features/auth/hooks/useProfile.ts"
/**
 * A view of My Profile on the homepage.
 *
 * @author AJ Kneisl
 */
export default function MyProfile() {
    const user = useUser()
    const profile = useProfile()

    return (
        <Card className="flex flex-col rounded-xl border border-text/10 p-4 shadow-md">
            {/* header */}
            <div className="flex flex-row items-center justify-evenly gap-3">
                {/* profile / user loading */}
                {(!profile || !user) && (
                    <>
                        <div className="size-24 animate-pulse rounded-full bg-text/10" />
                        <div className="min-w-0 flex-1">
                            <div className="mx-auto mb-2 h-5 w-30 animate-pulse rounded bg-text/10" />
                            <div className="flex flex-col items-center gap-2">
                                <Badge>
                                    <div className="h-5 w-16 animate-pulse rounded bg-text/10" />
                                </Badge>
                                <div className="h-3 w-24 animate-pulse rounded bg-text/10" />
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

                                <div className="flex flex-row gap-2">
                                    <Link
                                        to={`/user/${user?.username}`}
                                        className="text-xs text-text/60 underline-offset-2 transition-all hover:text-text hover:underline"
                                    >
                                        View profile
                                    </Link>

                                    <Link
                                        to={`/friends`}
                                        className="block text-xs text-text/60 underline-offset-2 transition-all hover:text-text hover:underline lg:hidden"
                                    >
                                        View friends
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Card>
    )
}
