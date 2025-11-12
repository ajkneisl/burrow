import { useQuery } from "@tanstack/react-query"
import { GroupMeetingCard } from "@features/burrows/components/GroupMeetingCard.tsx"
import { useNavigate } from "react-router"
import useToken from "@features/auth/hooks/useToken.ts"
import type { BurrowType } from "@features/burrows/burrows.types.ts"
import { getMeetings } from "@features/burrows/burrows.api.ts"
import { Badge, Button, Card } from "@umnburrow/core"
import { useAtom } from "jotai"
import { studyGroupModal } from "@features/burrows/create/create.atom.ts"

/**
 * When there's an error loading the preview.
 *
 * @param onRetry When they press retry.
 */
function ErrorPreview({ onRetry }: { onRetry: () => void }) {
    return (
        <Card className="mt-8">
            <div className="min-w-0 flex-1">
                <h4 className="text-destructive text-sm font-semibold">
                    Failed to load upcoming Burrows
                </h4>
                <p className="text-text/70 mt-1 text-xs">
                    There was an issue loading Burrows. Please try again.
                </p>
                <div className="mt-3">
                    <Button color="PRIMARY" onClick={onRetry}>
                        Retry
                    </Button>
                </div>
            </div>
        </Card>
    )
}

/**
 * A skeleton loading card.
 *
 * @param amount The number of cards to show.
 */
function LoadingPreview({ amount }: { amount: number }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 overflow-auto">
            <h3 className="text-text/60 mb-2 self-start text-sm font-semibold tracking-wide uppercase">
                Upcoming Burrows
            </h3>

            {Array.from({ length: amount }).map((_, i) => (
                <Card className="w-full" key={i}>
                    <div className="animate-pulse space-y-4">
                        <div className="flex flex-row justify-between gap-4">
                            <div className="animate-pulse space-y-4">
                                <div className="bg-text/10 h-4 w-48 rounded" />
                                <div className="bg-text/10 h-3 w-32 rounded" />
                            </div>

                            <div className="bg-text/10 size-8 rounded-full" />
                        </div>

                        <div className="flex gap-2">
                            <Badge>
                                <div className="h-4 w-16" />
                            </Badge>
                            <Badge>
                                <div className="w-12" />
                            </Badge>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}

/**
 * {@link PreviewGroupMeetings}
 */
type PreviewGroupsProps = {
    kind: BurrowType
    fullPage: string
    amount: number
}

/**
 * Preview a list of group meetings
 *
 * @param kind The kind of meetings
 * @param fullPage The link to the full page of this type of meeting.
 * @param amount The amount of meetings to preview.
 * @constructor
 */
export default function PreviewGroupMeetings({
    kind,
    fullPage,
    amount
}: PreviewGroupsProps) {
    const nav = useNavigate()
    const auth = useToken()

    const [, setModalOpen] = useAtom(studyGroupModal)

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: [kind],
        enabled: auth !== "" && auth !== null,
        queryFn: () => getMeetings(auth!, kind)
    })

    if (isError) {
        return <ErrorPreview onRetry={refetch} />
    }

    if (isLoading || !data) {
        return <LoadingPreview amount={amount} />
    }

    return (
        <div className="flex flex-col items-center justify-center gap-2 overflow-auto">
            <h3 className="text-text/60 mb-2 self-start text-sm font-semibold tracking-wide uppercase">
                Upcoming Burrows
            </h3>

            {data.contents && data.contents.length > 0 ? (
                data.contents
                    .slice(0, amount)
                    .map((meeting) => (
                        <GroupMeetingCard meetingResponse={meeting} />
                    ))
            ) : (
                <Card
                    aria-live="polite"
                    aria-label="No upcoming meetings"
                    className="border-text/40 text-text/50 flex h-24 w-full items-center justify-center border-2 border-dashed opacity-50 md:min-w-xs"
                >
                    <p className="text-center text-sm tracking-wide">
                        No upcoming Burrows.
                        <br />
                        <button
                            onClick={() => setModalOpen(true)}
                            className="hover:text-text/70 cursor-pointer underline"
                        >
                            Start one
                        </button>
                        .
                    </p>
                </Card>
            )}

            <Button className="w-full" onClick={() => nav(fullPage)}>
                Browse
            </Button>
        </div>
    )
}
