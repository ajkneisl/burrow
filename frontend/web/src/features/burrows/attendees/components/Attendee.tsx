import { formatTimeAgo } from "@api/util.ts"
import type {
    BurrowMembershipResponse,
    BurrowMemberStatus,
    BurrowRole
} from "@features/burrows/burrows.types.tsx"
import useUser from "@features/auth/hooks/useUser.ts"
import { useMemo } from "react"
import { toggleBanMember, changeRole } from "@features/burrows/burrows.api.ts"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import DisplayMember from "@features/burrows/attendees/components/DisplayMember.tsx"

/**
 * The color depending on the role.
 *
 * @param role The role to find the color for.
 * @param status The status of the user. If they're banned, it overwrites the others.
 *
 * @author AJ Kneisl
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

/**
 * {@link Attendee}
 */
type AttendeeProps = {
    meeting: BurrowMembershipResponse
    meetingRole: BurrowRole
}

/**
 * View an individual attendee.
 *
 * @param user The attendee information.
 * @param membership The attendee's membership information.
 * @param meetingRole The role of the authorized user.
 * @param profile The user's profile.
 *
 * @author AJ Kneisl
 */
export default function Attendee({
    meeting: { user, membership, profile },
    meetingRole
}: AttendeeProps) {
    const userID = useUser()?.id
    const queryClient = useQueryClient()

    const isSelf = useMemo(() => userID === user.id, [user, userID])

    // ban / unban a user, clears the attendees
    const banMutation = useMutation({
        mutationFn: async (targetUserId: string) =>
            await toggleBanMember(membership.burrowID, targetUserId),

        onSuccess: async () =>
            await queryClient.invalidateQueries({
                queryKey: ["attendees", membership.burrowID]
            })
    })

    // promote a member and clear attendees
    const modMutation = useMutation({
        mutationFn: async (targetUserId: string) =>
            await changeRole(membership.burrowID, targetUserId, "MODERATOR"),

        onSuccess: async () =>
            await queryClient.invalidateQueries({
                queryKey: ["attendees", membership.burrowID]
            })
    })

    // demote a moderator and clear attendees
    const demoteModMutation = useMutation({
        mutationFn: async (targetUserId: string) =>
            await changeRole(membership.burrowID, targetUserId, "MEMBER"),

        onSuccess: async () =>
            await queryClient.invalidateQueries({
                queryKey: ["attendees", membership.burrowID]
            })
    })

    const [statusText, statusColor] = useMemo(() => {
        return [
            membership.status === "BANNED" ? "Banned" : membership.role,
            roleBadge(membership.role, membership.status)
        ]
    }, [membership.role, membership.status])

    const functions = useMemo(() => {
        const canPromote =
            membership.role === "MEMBER" &&
            membership.status !== "BANNED" &&
            meetingRole === "HOST" &&
            !isSelf

        const canDemote =
            membership.role === "MODERATOR" &&
            membership.status !== "BANNED" &&
            meetingRole === "HOST" &&
            !isSelf

        const canBan = // user is a member, authorized user is a host or moderator
            (membership.role === "MEMBER" &&
                (meetingRole === "HOST" || meetingRole === "MODERATOR")) ||
            // user is a moderator, authorized user is a host
            (membership.role === "MODERATOR" && meetingRole === "HOST")

        return {
            // promote user
            ...(canPromote && {
                Promote: () => modMutation.mutate(membership.userID)
            }),

            // demote user
            ...(canDemote && {
                Demote: () => demoteModMutation.mutate(membership.userID)
            }),

            // ban user
            ...(canBan && {
                [membership.status === "BANNED" ? "Unban" : "Ban"]: () =>
                    banMutation.mutate(membership.userID)
            })
        }
    }, [
        banMutation,
        demoteModMutation,
        isSelf,
        meetingRole,
        membership.role,
        membership.status,
        membership.userID,
        modMutation
    ])

    return (
        <DisplayMember
            username={user.username}
            profile={profile}
            isSelf={isSelf}
            statusText={statusText}
            statusColor={statusColor}
            footer={`Joined ${formatTimeAgo(membership.joinedAt)}`}
            functions={functions}
        />
    )
}
