import { useQuery } from "@tanstack/react-query"
import type {
    BurrowRole,
    BurrowMembershipResponse,
    JoinRequestWithUser,
    InviteWithUsers
} from "@features/burrows/burrows.types.tsx"
import type { PaginatedResponse } from "@api/api.types.ts"
import { useParams } from "react-router"
import { getAttendees } from "@features/burrows/burrows.api.ts"
import {
    getJoinRequests,
    getInvites
} from "@features/burrows/attendees/attendees.api.ts"
import useUser from "@features/auth/hooks/useUser.ts"
import Attendee from "./Attendee.tsx"
import { useMemo, useState } from "react"
import { Button, Card, ViewErrors } from "@umnburrow/core"
import { capitalizeFirstLetter } from "@api/util.ts"
import InviteRequest from "@features/burrows/attendees/components/InviteRequest.tsx"
import JoinRequest from "@features/burrows/attendees/components/JoinRequest.tsx"
import InviteUser from "@features/burrows/attendees/components/InviteUser.tsx"

/**
 * The order of memberships to display.
 */
const order = {
    HOST: 0,
    MODERATOR: 1,
    MEMBER: 2
}

/**
 * Sort memberships by their order as defined by {@link order}.
 *
 * @param m1 A membership
 * @param m2 A membership.
 */
function sortMemberships(
    m1: BurrowMembershipResponse,
    m2: BurrowMembershipResponse
) {
    const r1 = order[m1.membership.role as keyof typeof order] ?? 3

    const r2 = order[m2.membership.role as keyof typeof order] ?? 3

    return r1 - r2
}

/**
 * @see ViewAttendees
 */
type ViewAttendeesProps = {
    term?: string
}

/**
 * View all attendees in a group.
 *
 * @author AJ Kneisl
 */
export default function ViewAttendees({
    term = "Attendees"
}: ViewAttendeesProps) {
    const { id: burrowID } = useParams<{ id: string }>()
    const user = useUser()

    const [viewMode, setViewMode] = useState<"attendees" | "requests">(
        "attendees"
    )
    const [attendeesPage, setAttendeesPage] = useState(1)
    const [requestsPage, setRequestsPage] = useState(1)

    // attendees
    const { data, isLoading, isError, error } = useQuery<
        PaginatedResponse<BurrowMembershipResponse>
    >({
        queryKey: ["attendees", burrowID, attendeesPage],
        queryFn: async () => {
            const response = await getAttendees(burrowID!, attendeesPage)
            return {
                ...response,
                contents: response.contents.filter(
                    (r) => r.membership.status !== "LEFT"
                )
            }
        }
    })

    // join requests
    const {
        data: joinRequests,
        isLoading: requestsLoading,
        isError: requestsError,
        error: requestsErrorMessage
    } = useQuery<PaginatedResponse<JoinRequestWithUser>>({
        queryKey: ["joinRequests", burrowID, requestsPage],
        queryFn: async () => {
            return await getJoinRequests(burrowID!, requestsPage)
        },
        enabled: !!burrowID
    })

    // invites
    const {
        data: invites,
        isLoading: invitesLoading,
        isError: invitesError
    } = useQuery<PaginatedResponse<InviteWithUsers>>({
        queryKey: ["invites", burrowID, attendeesPage],
        queryFn: async () => {
            return await getInvites(burrowID!, attendeesPage)
        },
        enabled: !!burrowID
    })

    const meetingRole: BurrowRole | null = useMemo(() => {
        if (!data || !user) return "MEMBER"

        return (
            data.contents?.find(
                ({ membership }) => membership.userID === user.id
            )?.membership.role ?? null
        )
    }, [data, user])

    const pendingRequests = useMemo(() => {
        return (joinRequests?.contents ?? []).filter(
            (r) => r.request.status === "PENDING"
        )
    }, [joinRequests])

    const totalPendingRequests = joinRequests?.totalResults ?? 0

    const attendeesView = (
        <>
            {isLoading && (
                <div className="border-hero bg-card text-text rounded-lg border p-4">
                    Loading attendees…
                </div>
            )}

            {isError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    {(error as Error)?.message || "Failed to load attendees"}
                </div>
            )}

            {!isLoading && !isError && data && meetingRole && (
                <>
                    <ul className="flex flex-col gap-3">
                        {(data.contents ?? [])
                            .sort((m1, m2) => sortMemberships(m1, m2))
                            .map((m) => (
                                <Attendee
                                    key={m.membership.userID}
                                    meetingRole={meetingRole}
                                    meeting={m}
                                />
                            ))}

                        {!invitesLoading &&
                            !invitesError &&
                            invites &&
                            (invites.contents ?? []).map((invite) => (
                                <InviteRequest invite={invite} />
                            ))}
                    </ul>

                    {data.totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                            <Button
                                disabled={attendeesPage === 1}
                                onClick={() => setAttendeesPage((p) => p - 1)}
                            >
                                Previous
                            </Button>
                            <span className="text-sm">
                                Page {attendeesPage} of {data.totalPages}
                            </span>
                            <Button
                                disabled={attendeesPage === data.totalPages}
                                onClick={() => setAttendeesPage((p) => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </>
    )

    const joinRequestsView = (
        <>
            {requestsLoading && (
                <div className="border-hero bg-card text-text rounded-lg border p-4">
                    Loading join requests…
                </div>
            )}

            {requestsError && (
                <ViewErrors
                    errors={[requestsErrorMessage.message]}
                    clearErrors={() => {}}
                />
            )}

            {!requestsLoading && !requestsError && joinRequests && (
                <>
                    <ul className="flex flex-col gap-3">
                        {pendingRequests.map((request) => (
                            <JoinRequest
                                key={request.request.requesterID}
                                request={request}
                            />
                        ))}

                        {pendingRequests.length === 0 && (
                            <Card className="!bg-background/60 !border-background/80 text-text/70 text-sm ">
                                No pending join requests.
                            </Card>
                        )}
                    </ul>

                    {joinRequests.totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                            <Button
                                disabled={requestsPage === 1}
                                onClick={() => setRequestsPage((p) => p - 1)}
                            >
                                Previous
                            </Button>
                            <span className="text-sm">
                                Page {requestsPage} of {joinRequests.totalPages}
                            </span>
                            <Button
                                disabled={
                                    requestsPage === joinRequests.totalPages
                                }
                                onClick={() => setRequestsPage((p) => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </>
    )

    return (
        <Card className="min-w-xs">
            {/* header */}
            <div className="mb-2 flex flex-row items-center justify-between">
                <h3 className="text-center text-sm font-semibold">
                    {capitalizeFirstLetter(
                        viewMode === "attendees" && term ? term : viewMode
                    )}
                </h3>

                {meetingRole !== "MEMBER" && (
                    <Button
                        className="text-xs"
                        onClick={() =>
                            setViewMode(
                                viewMode === "attendees"
                                    ? "requests"
                                    : "attendees"
                            )
                        }
                        color={"LINK"}
                    >
                        {viewMode === "attendees"
                            ? `View Requests (${totalPendingRequests})`
                            : "View Attendees"}
                    </Button>
                )}
            </div>

            {/* body */}
            {viewMode === "attendees" ? attendeesView : joinRequestsView}

            {/* invite button */}
            {meetingRole !== "MEMBER" && (
                <InviteUser
                    burrowID={burrowID!}
                    onInvite={() => {
                        setAttendeesPage(1)
                        setViewMode("attendees")
                    }}
                />
            )}
        </Card>
    )
}
