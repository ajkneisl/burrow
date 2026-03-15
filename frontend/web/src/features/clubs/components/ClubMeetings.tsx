import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { CalendarClock, Calendar, Plus } from "lucide-react"
import { getClubBurrows } from "@features/clubs/clubs.api.ts"
import type { BurrowResponse } from "@features/burrows/burrows.types.tsx"
import { NOT_REOCCURRING } from "@features/burrows/burrows.types.tsx"
import { BurrowCard } from "@features/burrows/components/BurrowCard.tsx"
import useToken from "@features/auth/hooks/useToken.ts"
import { useSetAtom } from "jotai"
import { createBurrowModal, selectedClubIDAtom } from "@features/burrows/create/create.atom.ts"
import type { ClubRole } from "@features/clubs/clubs.types.tsx"

/**
 * {@link ClubMeetings}
 */
type ClubMeetingsProps = {
    clubName: string
    clubID: string
    role?: ClubRole | null
}

/**
 * A club's meetings.
 *
 * @param clubName The name of the club.
 * @constructor
 */
export default function ClubMeetings({ clubName, clubID, role }: ClubMeetingsProps) {
    const auth = useToken()
    const setCreateModal = useSetAtom(createBurrowModal)
    const setSelectedClubID = useSetAtom(selectedClubIDAtom)

    const canCreate = role === "ADMINISTRATOR" || role === "MODERATOR"

    const { data: burrows } = useQuery<BurrowResponse[]>({
        queryKey: ["clubBurrows", clubName],
        enabled: auth !== "" && !!clubName,
        queryFn: async () => await getClubBurrows(clubName)
    })

    const reoccurringBurrows = useMemo(
        () =>
            (burrows ?? []).filter(
                (b) => b.burrow.reoccurring !== NOT_REOCCURRING
            ),
        [burrows]
    )

    const upcomingBurrows = useMemo(
        () =>
            (burrows ?? []).filter(
                (b) => b.burrow.reoccurring === NOT_REOCCURRING
            ),
        [burrows]
    )

    return (
        <>
            {/* Reoccurring Meetings */}
            <div>
                <h3 className="text-text mb-3 text-sm font-semibold">
                    Reoccurring Meetings
                </h3>

                {reoccurringBurrows.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-4 text-center">
                        <CalendarClock className="text-text/30 h-8 w-8" />
                        <p className="text-text/50 text-sm">
                            No reoccurring meetings.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {reoccurringBurrows.map((b) => (
                            <BurrowCard key={b.burrow.id} meetingResponse={b} />
                        ))}
                    </div>
                )}
            </div>

            {/* Upcoming Meetings */}
            <div>
                <h3 className="text-text mb-3 text-sm font-semibold">
                    Meetings
                </h3>
                {upcomingBurrows.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-4 text-center">
                        <Calendar className="text-text/30 h-8 w-8" />
                        <p className="text-text/50 text-sm">No meetings.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {upcomingBurrows.map((b) => (
                            <BurrowCard key={b.burrow.id} meetingResponse={b} />
                        ))}
                    </div>
                )}
            </div>
        </>
    )
}
