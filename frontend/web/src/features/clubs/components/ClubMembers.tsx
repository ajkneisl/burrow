import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button, Card } from "@umnburrow/core"
import { getClubMembers } from "@features/clubs/clubs.api.ts"
import {
    type ClubMemberResponse,
    ROLE_ORDER
} from "@features/clubs/clubs.types.ts"
import type { PaginatedResponse } from "@api/api.types.ts"
import ClubMemberCard from "@features/clubs/components/ClubMemberCard.tsx"
import useToken from "@features/auth/hooks/useToken.ts"

/**
 * {@link ClubMembers}
 */
type ClubMembersProps = {
    clubName: string
}

/**
 * The members of the club.
 *
 * @param clubName The name of the club.
 */
export default function ClubMembers({
    clubName,
}: ClubMembersProps) {
    const auth = useToken()
    const [membersPage, setMembersPage] = useState(1)

    const { data: members, isLoading: membersLoading } = useQuery<
        PaginatedResponse<ClubMemberResponse>
    >({
        queryKey: ["clubMembers", clubName, membersPage],
        enabled: auth !== "" && !!clubName,
        queryFn: async () => await getClubMembers(clubName, membersPage)
    })

    const sortedMembers = useMemo(() => {
        if (!members?.contents) return []
        return [...members.contents].sort(
            (a, b) =>
                (ROLE_ORDER[a.member.role] ?? 3) -
                (ROLE_ORDER[b.member.role] ?? 3)
        )
    }, [members])

    return (
        <Card className="min-w-xs">
            <h3 className="mb-3 text-sm font-semibold">Members</h3>

            {membersLoading && (
                <div className="text-text/60 text-sm">Loading members...</div>
            )}

            {!membersLoading && sortedMembers.length === 0 && (
                <div className="text-text/50 text-sm">No members yet.</div>
            )}

            {!membersLoading && sortedMembers.length > 0 && (
                <>
                    <ul className="flex flex-col gap-3">
                        {sortedMembers.map((m) => (
                            <ClubMemberCard
                                key={m.member.userID}
                                data={m}
                                clubName={clubName}
                            />
                        ))}
                    </ul>

                    {members && members.totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                            <Button
                                disabled={membersPage === 1}
                                onClick={() => setMembersPage((p) => p - 1)}
                            >
                                Previous
                            </Button>
                            <span className="text-xs">
                                Page {membersPage} of {members.totalPages}
                            </span>
                            <Button
                                disabled={membersPage === members.totalPages}
                                onClick={() => setMembersPage((p) => p + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            )}
        </Card>
    )
}
