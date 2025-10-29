import { useParams } from "react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Badge, Card, Button } from "@umnburrow/core"
import {
    followUser,
    getUserByUsername,
    unFollowUser
} from "@features/profile/profile.api.ts"
import useToken from "@features/auth/api/hooks/useToken.ts"
import { GroupMeetingCard } from "@features/groups/components/GroupMeetingCard.tsx"
import clsx from "clsx"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { useState } from "react"
import useUser from "@features/auth/api/hooks/useUser.ts"

/**
 * Convert a year into a textual graduation year, like `Senior`.
 * If this goes past the four most recent, it'll turn 2050 to '50.
 *
 * @param year The graduation year.
 */
function convertGraduationYear(year: number | null) {
    if (year === null) return ""

    const currentYear = new Date().getFullYear()

    switch (year) {
        case currentYear + 1:
            return "Senior"
        case currentYear + 2:
            return "Junior"
        case currentYear + 3:
            return "Sophomore"
        case currentYear + 4:
            return "Freshman"
        default:
            return `'${year.toString().slice(2, 4)}`
    }
}

/**
 * The view of a profile.
 */
export default function ProfileView() {
    const auth = useToken()
    const user = useUser()

    const { username = "me" } = useParams()
    const queryClient = useQueryClient()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { data, isLoading, error } = useQuery({
        queryKey: ["profile", username],
        enabled: auth !== null,
        queryFn: async () => await getUserByUsername(auth, username)
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
                            // Adjust the viewed user's followers count
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

    // when loading
    if (isLoading) {
        return (
            <div className="mx-auto max-w-6xl py-8">
                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
                    <Card>
                        <div className="p-6">
                            <div className="h-6 w-40 animate-pulse rounded bg-card" />
                            <div className="mt-4 space-y-2">
                                <div className="h-4 w-full animate-pulse rounded bg-card" />
                                <div className="h-4 w-5/6 animate-pulse rounded bg-card" />
                                <div className="h-4 w-2/3 animate-pulse rounded bg-card" />
                            </div>
                        </div>
                    </Card>

                    <Card>
                        <div className="p-6">
                            <div className="h-6 w-32 animate-pulse rounded bg-card" />
                            <div className="mt-4 space-y-3">
                                <div className="h-4 w-full animate-pulse rounded bg-card" />
                                <div className="h-4 w-full animate-pulse rounded bg-card" />
                                <div className="h-4 w-full animate-pulse rounded bg-card" />
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
                <div className="mx-4 flex items-center justify-between gap-4 py-6 px-0 sm:px-2">
                    <div className="flex items-center gap-4">
                        <ProfilePicture
                            name={data.profile.name}
                            userID={data.profile.userID}
                            size="lg"
                        />

                        <div className="pb-1">
                            {/* username */}
                            <h1 className="text-3xl font-extrabold tracking-tight">
                                {data.profile.name}
                            </h1>

                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                {/* profile URL*/}
                                <span className="font-mono text-text/60">
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
                            <div className="mt-1 text-sm text-text/80">
                                <span className="font-mono">
                                    {data.following.followers}
                                </span>{" "}
                                follower
                                {data.following.followers === 1 ? "" : "s"}{" "}
                                <span className="opacity-60">•</span>{" "}
                                <span className="font-mono">
                                    {data.following.following}
                                </span>{" "}
                                following
                            </div>

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
                        {/* follow button*/}
                        <Button
                            aria-label="Follow user"
                            color={
                                data.following.youFollow ? "SUCCESS" : "PRIMARY"
                            }
                            onClick={follow}
                            disabled={data.profile.userID === user?.id}
                            loading={isSubmitting}
                        >
                            {followText}
                        </Button>
                    </div>
                </div>

                {/* main profile content*/}
                <div className="grid gap-6 px-4 py-6 lg:grid-cols-[1fr_340px]">
                    {/* about section */}
                    <Card title="About">
                        {/* bio */}
                        <p
                            className={clsx(
                                "mt-3 leading-relaxed",
                                !data.profile.bio && "opacity-60 italic"
                            )}
                        >
                            {data.profile.bio || "No bio provided."}
                        </p>

                        {/* classes */}
                        <div className="mt-6">
                            <div className="mb-2 flex items-center justify-between">
                                <h3 className="text-sm font-semibold">
                                    Classes
                                </h3>
                            </div>

                            {data.profile.classes !== null &&
                            data.profile.classes.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {data.profile.classes.map((cls) => (
                                        <span
                                            key={cls}
                                            className="rounded-md border border-primary/20 bg-card py-1 text-sm font-mono"
                                            title={cls}
                                        >
                                            {cls}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-2 opacity-60 italic">
                                    No classes listed.
                                </p>
                            )}
                        </div>
                    </Card>

                    {/* contact section */}
                    <Card title="Contact">
                        <ul className="mt-4 space-y-3">
                            {/* email */}
                            <ContactRow
                                label="Email"
                                value={data.user.email}
                                href={
                                    data.user.email
                                        ? `mailto:${data.user.email}`
                                        : undefined
                                }
                            />

                            {/* phone */}
                            <ContactRow
                                label="Phone"
                                value={data.profile.phoneNumber ?? ""}
                                href={
                                    data.profile.phoneNumber
                                        ? `tel:${data.profile.phoneNumber}`
                                        : undefined
                                }
                            />
                        </ul>
                    </Card>
                </div>

                {/* meetings section */}
                <section className="px-4 pb-12 md:grid grid-cols-2 flex flex-col gap-4">
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
                                <GroupMeetingCard
                                    meeting={meeting}
                                    bookmarked={false}
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
                                <GroupMeetingCard
                                    meeting={meeting}
                                    bookmarked={false}
                                />
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}

function ContactRow({
    label,
    value,
    href
}: {
    label: string
    value?: string
    href?: string
}) {
    return (
        <li className="flex items-center justify-between gap-4">
            <span className="text-sm opacity-70">{label}</span>
            {value ? (
                href ? (
                    <a className="link" href={href}>
                        {value}
                    </a>
                ) : (
                    <span>{value}</span>
                )
            ) : (
                <span className="opacity-40">—</span>
            )}
        </li>
    )
}
