import { formatTimeAgo } from "@api/util.ts"
import { Button } from "@umnburrow/core"
import type {
    BurrowMembershipResponse,
    BurrowMemberStatus,
    BurrowRole
} from "@features/burrows/burrows.types.ts"
import useUser from "@features/auth/hooks/useUser.ts"
import { useMemo } from "react"
import { toggleBanMember, changeRole } from "@features/burrows/burrows.api.ts"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import useToken from "@features/auth/hooks/useToken.ts"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { useNavigate } from "react-router"

/**
 * The color depending on the role.
 *
 * @param role The role to find the color for.
 * @param status The status of the user. If they're banned, it overwrites the others.
 */
function roleBadge(role: BurrowRole, status: BurrowMemberStatus) {
    if (status === "BANNED") {
        return "bg-red-100 text-red-800 border-red-200"
    }

    switch (role) {
        case "HOST":
            return "bg-yellow-100 text-yellow-800 border-yellow-200"
        case "MODERATOR":
            return "bg-indigo-100 text-indigo-800 border-indigo-200"
        default:
            return "bg-gray-100 text-gray-800 border-gray-200"
    }
}

async function setRoleModerator(
    auth: string,
    meetingId: string,
    userId: string
): Promise<void> {
    await changeRole(auth, meetingId, userId, "MODERATOR")
}

/**
 * {@link Attendee}
 */
type AttendeeProps = {
    meeting: BurrowMembershipResponse
    meetingRole: BurrowRole
}

/**
 * View an invidiual attendee.
 *
 * @param user The attendee information.
 * @param membership The attendee's membership information.
 * @param meetingRole The role of the authorized user.
 * @param profile The user's profile.
 * @constructor
 */
export default function Attendee({
    meeting: { user, membership, profile },
    meetingRole
}: AttendeeProps) {
    const auth = useToken()
    const nav = useNavigate()
    const userId = useUser()?.id
    const queryClient = useQueryClient()

    // ban / unban a user
    const banMutation = useMutation({
        mutationFn: async (targetUserId: string) =>
            await toggleBanMember(auth!, membership.meetingID, targetUserId),
        onSuccess: async () =>
            await queryClient.invalidateQueries({
                queryKey: ["attendees", membership.meetingID]
            })
    })

    // promote a member
    const modMutation = useMutation({
        mutationFn: async (targetUserId: string) =>
            await setRoleModerator(auth!, membership.meetingID, targetUserId),
        onSuccess: async () =>
            await queryClient.invalidateQueries({
                queryKey: ["attendees", membership.meetingID]
            })
    })

    // demote a moderator
    const demoteModMutation = useMutation({
        mutationFn: async (targetUserId: string) =>
            changeRole(auth!, membership.meetingID, targetUserId, "MEMBER"),
        onSuccess: async () =>
            await queryClient.invalidateQueries({
                queryKey: ["attendees", membership.meetingID]
            })
    })

    const isHost = useMemo(() => meetingRole === "HOST", [meetingRole])
    const isModerator = useMemo(
        () => meetingRole === "MODERATOR",
        [meetingRole]
    )
    const isSelf = useMemo(() => userId === user.id, [user, userId])

    const canBan = useMemo(
        () =>
            // user is a member, authorized user is a host or moderator
            (membership.role === "MEMBER" && (isHost || isModerator)) ||
            // user is a moderator, authorized user is a host
            (membership.role === "MODERATOR" && isHost),
        [isHost, isModerator, membership.role]
    )

    const canDemote = useMemo(
        () =>
            membership.role === "MODERATOR" &&
            membership.status !== "BANNED" &&
            isHost &&
            !isSelf,
        [isHost, isSelf, membership.role, membership.status]
    )

    const canPromote = useMemo(
        () =>
            membership.role === "MEMBER" &&
            membership.status !== "BANNED" &&
            isHost &&
            !isSelf,
        [isHost, isSelf, membership.role, membership.status]
    )

    return (
        <li
            onClick={() => nav(`/user/${user.username}`)}
            key={`${membership.meetingID}-${membership.userID}`}
            className="bg-background/60 border-background/80 cursor-pointer rounded-2xl border p-4"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="group mb-4 flex flex-row items-center gap-2">
                                <ProfilePicture
                                    name={profile.name}
                                    userID={user.id}
                                    size={"sm"}
                                />

                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">
                                        {profile.name}

                                        {isSelf && (
                                            <span className="text-text/60 ml-1 text-[10px] font-normal">
                                                (you)
                                            </span>
                                        )}
                                    </span>

                                    <span className="text-text/70 text-xs">
                                        {user.username}
                                    </span>
                                </div>
                            </div>

                            {membership.status === "WAITLISTED" && (
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="h-4 w-4 text-amber-600"
                                    >
                                        <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm.75 5.5a.75.75 0 0 0-1.5 0v4.25c0 .199.079.39.22.53l2.5 2.5a.75.75 0 1 0 1.06-1.06l-2.28-2.28Z" />
                                    </svg>{" "}
                                    Waitlisted
                                </span>
                            )}
                        </div>

                        <div className="text-text/50 text-xs">
                            Joined {formatTimeAgo(membership.joinedAt)}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${roleBadge(membership.role, membership.status)}`}
                    >
                        {membership.status === "BANNED"
                            ? "BANNED"
                            : membership.role}
                    </span>
                </div>
            </div>

            {(canPromote || canDemote || canBan) && (
                <div className="mt-4 flex flex-row items-center justify-center gap-2">
                    {canBan && membership.status !== "BANNED" && (
                        <Button
                            thin
                            color={"ERROR"}
                            onClick={() =>
                                banMutation.mutate(membership.userID)
                            }
                            disabled={banMutation.isPending}
                            aria-label={`Ban ${user.username}`}
                            title="Ban attendee"
                        >
                            {banMutation.isPending ? "Banning…" : "Ban"}
                        </Button>
                    )}

                    {canBan && membership.status === "BANNED" && (
                        <Button
                            thin
                            color={"ERROR"}
                            onClick={() =>
                                banMutation.mutate(membership.userID)
                            }
                            disabled={banMutation.isPending}
                            aria-label={`Unban ${user.username}`}
                            title="Unban attendee"
                        >
                            {banMutation.isPending ? "Unbanning…" : "Unban"}
                        </Button>
                    )}

                    {canDemote && (
                        <Button
                            color={"ERROR"}
                            thin
                            onClick={() =>
                                demoteModMutation.mutate(membership.userID)
                            }
                            loading={demoteModMutation.isPending}
                            aria-label={`Remove moderator role from ${user.username}`}
                            title="Remove moderator"
                        >
                            {demoteModMutation.isPending
                                ? "Updating…"
                                : "Remove moderator"}
                        </Button>
                    )}

                    {canPromote && (
                        <Button
                            thin
                            color={"SUCCESS"}
                            className="ml-1 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                            onClick={() =>
                                modMutation.mutate(membership.userID)
                            }
                            disabled={modMutation.isPending}
                            aria-label={`Promote ${user.username} to moderator`}
                            title="Make moderator"
                        >
                            {modMutation.isPending
                                ? "Updating…"
                                : "Make moderator"}
                        </Button>
                    )}
                </div>
            )}
        </li>
    )
}
