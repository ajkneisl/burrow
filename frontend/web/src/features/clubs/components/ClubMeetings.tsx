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
            {/* Reoccurring Burrows */}
            <div>
                <h3 className="mb-3 text-sm font-semibold text-text">
                    Reoccurring Burrows
                </h3>

                {reoccurringBurrows.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-4 text-center">
                        <CalendarClock className="size-8 text-text/30" />
                        <p className="text-sm text-text/50">
                            No reoccurring Burrows.
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

            {/* Upcoming Burrows */}
            <div>
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-text">Burrows</h3>

                    {canCreate && (
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedClubID(clubID)
                                setCreateModal("CLUB_EVENT")
                            }}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-neutral-900 transition-colors hover:bg-secondary-hover"
                        >
                            <Plus className="size-3.5" />
                            Create Burrow
                        </button>
                    )}
                </div>
                {upcomingBurrows.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-4 text-center">
                        <Calendar className="size-8 text-text/30" />
                        <p className="text-sm text-text/50">No Burrows.</p>
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
