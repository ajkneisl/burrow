import { useParams } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge, Button, Card, ViewErrors } from "@umnburrow/core"
import {
    followUser,
    getUserByUsername,
    unFollowUser
} from "@features/profile/profile.api.ts"
import useToken from "@features/auth/hooks/useToken.ts"
import { BurrowCard } from "@features/burrows/components/BurrowCard.tsx"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { useMemo, useState } from "react"
import useUser from "@features/auth/hooks/useUser.ts"
import About from "@features/profile/components/About.tsx"
import Contact from "@features/profile/components/Contact.tsx"
import EditProfile from "@features/profile/components/EditProfile.tsx"
import type { BurrowResponse } from "@features/burrows/burrows.types.tsx"
import { convertGraduationYear } from "@api/util.ts"
import Relations from "@features/profile/components/Relations.tsx"
import useMetaTags from "@features/layout/hooks/useMetaTags.ts"
import { useAtom } from "jotai"
import { profileEditErrors } from "@features/profile/profile.atom.ts"

/**
 * The view of a profile.
 */
export default function ProfileView() {
    const auth = useToken()
    const user = useUser()

    const { username = "me" } = useParams()
    const queryClient = useQueryClient()

    const [errors, setErrors] = useAtom(profileEditErrors)

    const [isSubmitting, setIsSubmitting] = useState(false)

    const { data, isLoading, error } = useQuery({
        queryKey: ["profile", username],
        queryFn: async () => await getUserByUsername(username)
    })

    const followText =
        data?.following?.youFollow && data?.following?.theyFollow
            ? "Friends"
            : data?.following?.youFollow
              ? "Following"
              : data?.following?.theyFollow
                ? "Follows you"
                : "Follow"

    async function follow() {
        if (auth === null || !data) return

        const wasFollowing = !!data.following?.youFollow
        const targetUserId = data.user.id

        try {
            setIsSubmitting(true)

            if (wasFollowing) {
                await unFollowUser(auth, targetUserId)
            } else {
                await followUser(auth, targetUserId)
            }

            queryClient.setQueryData(
                ["profile", username],
                (prev: typeof data | undefined) => {
                    if (!prev) return prev
                    const delta = wasFollowing ? -1 : 1
                    return {
                        ...prev,
                        following: {
                            ...prev.following,
                            youFollow: !wasFollowing,
                            followers: Math.max(
                                0,
                                (prev.following?.followers ?? 0) + delta
                            )
                        }
                    }
                }
            )
        } finally {
            setIsSubmitting(false)
        }
    }

    const isPrivate = useMemo(() => {
        if (!data || !user) return true

        return (
            data.profile.visibility !== "PUBLIC" && // make sure profile is not private
            data.user.id !== user.id && // make sure it's not you
            (data.profile.visibility === "PRIVATE" || // profile is private, cannot see
                (data.profile.visibility === "FRIENDS" && // profile is friends only, check if friends
                    !(data.following?.youFollow && data.following?.theyFollow)))
        )
    }, [data, user])

    // Set meta tags for this profile
    useMetaTags({
        title: data ? `Burrow — ${data.profile.name}` : "Burrow",
        description: data
            ? `View ${data.profile.name}'s profile on Burrow`
            : "View this profile on Burrow",
        url: `https://umn.app/user/${username}`,
        image: "https://umn.app/burrow.png"
    })

    // when loading
    if (isLoading) {
        return (
            <div className="mx-auto max-w-6xl py-8">
                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
                    <Card>
                        <div className="p-6">
                            <div className="bg-card h-6 w-40 animate-pulse rounded" />
                            <div className="mt-4 space-y-2">
                                <div className="bg-card h-4 w-full animate-pulse rounded" />
                                <div className="bg-card h-4 w-5/6 animate-pulse rounded" />
                                <div className="bg-card h-4 w-2/3 animate-pulse rounded" />
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="p-6">
                            <div className="bg-card h-6 w-32 animate-pulse rounded" />
                            <div className="mt-4 space-y-3">
                                <div className="bg-card h-4 w-full animate-pulse rounded" />
                                <div className="bg-card h-4 w-full animate-pulse rounded" />
                                <div className="bg-card h-4 w-full animate-pulse rounded" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        )
    }

    // invalid profile
    if (error || !data) {
        return (
            <div className="mx-auto max-w-3xl py-16 text-center">
                <h1 className="text-2xl font-bold">Profile unavailable</h1>

                <p className="mt-2 opacity-70">
                    There was an issue loading that profile.
                </p>
            </div>
        )
    }

    return (
        <div className="relative">
            <div className="mx-auto max-w-6xl">
                {/* name and profile picture */}
                <div className="mx-4 flex items-center justify-between gap-4 px-0 py-6 sm:px-2">
                    <div className="flex items-center gap-4">
                        <ProfilePicture
                            name={data.profile.name}
                            userID={data.profile.userID}
                            size="lg"
                            editable={data.user.id === user?.id}
                        />

                        <div className="pb-1">
                            {/* username */}
                            <h1 className="text-3xl font-extrabold tracking-tight">
                                {data.profile.name}
                            </h1>

                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                {/* profile URL*/}
                                <span className="text-text/60 font-mono">
                                    {data.user.username}
                                </span>

                                {/* graduation year */}
                                {data.profile.gradYear !== null && (
                                    <Badge>
                                        {convertGraduationYear(
                                            data.profile.gradYear
                                        )}
                                    </Badge>
                                )}
                            </div>

                            {/* followers / following */}
                            <Relations data={data} />

                            {/* how many mutual friends you have with them */}
                            {data.following.mutuals > 0 && (
                                <span className="text-xs opacity-70">
                                    You have{" "}
                                    <span className="font-mono">
                                        {data.following.mutuals}
                                    </span>{" "}
                                    mutual friends.
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        {data.profile.userID === user?.id ? (
                            <EditProfile
                                profile={data.profile}
                                user={data.user}
                            />
                        ) : (
                            <Button
                                aria-label="Follow user"
                                color={
                                    data.following.youFollow
                                        ? "SUCCESS"
                                        : "PRIMARY"
                                }
                                onClick={follow}
                                loading={isSubmitting}
                            >
                                {followText}
                            </Button>
                        )}
                    </div>
                </div>

                <ViewErrors errors={errors} clearErrors={() => setErrors([])} />

                {/* main profile content*/}
                {isPrivate ? (
                    <Card className="mb-4 text-center">
                        You cannot view this profile
                    </Card>
                ) : (
                    <div className="grid items-start gap-6 px-4 py-6 lg:grid-cols-[1fr_340px]">
                        <About profile={data.profile} />

                        <Contact user={data.user} profile={data.profile} />
                    </div>
                )}

                {/* meetings section */}
                {!isPrivate && (
                    <section className="flex grid-cols-2 flex-col gap-4 px-4 pb-12 md:grid">
                        {/* hosted meetings */}
                        <div className="col-span-1 flex flex-col gap-4">
                            <h2 className="figtree text-lg">Hosted Burrows</h2>

                            {(data.recentHostedGroups.length ?? 0) === 0 ? (
                                <Card>
                                    <p className="text-text/70 text-center">
                                        No hosted meetings.
                                    </p>
                                </Card>
                            ) : (
                                data.recentHostedGroups.map((meeting) => (
                                    <BurrowCard
                                        meetingResponse={
                                            {
                                                burrow: meeting,
                                                bookmarked: false
                                            } as BurrowResponse
                                        }
                                        details={false}
                                    />
                                ))
                            )}
                        </div>

                        {/* joined meetings */}
                        <div className="col-span-1 flex flex-col gap-4">
                            <h2 className="figtree text-lg">Joined Burrows</h2>

                            {(data.recentJoinedGroups.length ?? 0) === 0 ? (
                                <Card className="w-full">
                                    <p className="text-text/70 text-center">
                                        No joined meetings.
                                    </p>
                                </Card>
                            ) : (
                                data.recentJoinedGroups.map((meeting) => (
                                    <BurrowCard
                                        meetingResponse={
                                            {
                                                burrow: meeting,
                                                bookmarked: false
                                            } as BurrowResponse
                                        }
                                        details={false}
                                    />
                                ))
                            )}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}
