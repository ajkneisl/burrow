import { View } from "react-native"
import ClubMember from "@features/clubs/components/ClubMember"
import { Text } from "@components/core"
import {
    type ClubMemberResponse,
    ClubResponse,
    ROLE_ORDER
} from "@features/clubs/club.types"
import { useQuery } from "@tanstack/react-query"
import type { PaginatedResponse } from "@api/api.types"
import { get } from "@api/api"
import { useMemo } from "react"
import useUser from "@features/auth/hooks/useUser"

/**
 * {@link ClubMembers}
 */
type ClubMembersProps = {
    clubResponse: ClubResponse
}

/**
 * The members of a club.
 *
 * @param clubResponse The club API response
 */
export default function ClubMembers({ clubResponse }: ClubMembersProps) {
    const user = useUser()
    const { club } = clubResponse

    const { data: members, isLoading: membersLoading } = useQuery<
        PaginatedResponse<ClubMemberResponse>
    >({
        queryKey: ["clubMembers", club.name, 1],
        queryFn: async () =>
            await get(`/clubs/${club.name}/members`, { query: { page: 1 } })
    })

    // club members in order of their role
    const sortedMembers = useMemo(() => {
        if (!members?.contents) return []

        return [...members.contents].sort(
            (a, b) =>
                (ROLE_ORDER[a.member.role] ?? 3) -
                (ROLE_ORDER[b.member.role] ?? 3)
        )
    }, [members])

    return (
        <View>
            <Text className="text-text font-semibold text-sm mb-3">
                Members
            </Text>

            {membersLoading && (
                <Text className="text-text opacity-50 text-sm">
                    Loading members...
                </Text>
            )}

            {!membersLoading && sortedMembers.length === 0 && (
                <Text className="text-text opacity-50 text-sm">
                    No members yet.
                </Text>
            )}

            {!membersLoading && sortedMembers.length > 0 && (
                <View className="gap-3">
                    {sortedMembers.map((m) => (
                        <ClubMember
                            key={m.member.userID}
                            data={m}
                            isSelf={user?.id === m.member.userID}
                            isClubOwner={m.member.userID === club.ownerID}
                        />
                    ))}

                    {members && members.totalPages > 1 && (
                        <Text className="text-text opacity-40 text-xs text-center mt-2">
                            Showing page 1 of {members.totalPages}
                        </Text>
                    )}
                </View>
            )}
        </View>
    )
}
