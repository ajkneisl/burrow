import { useQuery } from "@tanstack/react-query"
import type {
    MeetingRole,
    MeetingMembershipResponse
} from "@features/groups/groups.types.ts"
import { useParams } from "react-router"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom.ts"
import { getAttendees } from "@features/groups/groups.api.ts"
import useUser from "@features/auth/hooks/useUser.ts"
import Attendee from "./Attendee.tsx"
import { useMemo } from "react"

/**
 * View all attendees in a group.
 */
export default function ViewAttendees() {
    const { id } = useParams<{ id: string }>()
    const [auth] = useAtom(authToken)
    const user = useUser()

    const { data, isLoading, isError, error } = useQuery<
        MeetingMembershipResponse[]
    >({
        queryKey: ["attendees", id],
        queryFn: async () => {
            const request = await getAttendees(auth, id!)

            return request.filter((r) => r.membership.status !== "LEFT")
        }
    })

    const meetingRole: MeetingRole | null = useMemo(() => {
        if (!data || !user) return "MEMBER"

        return (
            data?.find(({ membership }) => membership.userId === user.id)
                ?.membership.role ?? null
        )
    }, [data, user])

    return (
        <div className="mx-auto w-full">
            {isLoading && (
                <div className="rounded-lg border border-hero bg-card p-4 text-text">
                    Loading attendees…
                </div>
            )}

            {isError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {(error as Error)?.message || "Failed to load attendees"}
                </div>
            )}

            {!isLoading && !isError && data && meetingRole && (
                <ul className="flex flex-col gap-3">
                    {(data ?? [])
                        .sort((m1, m2) => {
                            const order = { HOST: 0, MODERATOR: 1, MEMBER: 2 }
                            const r1 =
                                order[
                                    m1.membership.role as keyof typeof order
                                ] ?? 3
                            const r2 =
                                order[
                                    m2.membership.role as keyof typeof order
                                ] ?? 3
                            return r1 - r2
                        })
                        .map((m) => (
                            <Attendee meetingRole={meetingRole} meeting={m} />
                        ))}

                    {(data ?? []).length === 0 && (
                        <li className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                            No attendees yet.
                        </li>
                    )}
                </ul>
            )}
        </div>
    )
}
