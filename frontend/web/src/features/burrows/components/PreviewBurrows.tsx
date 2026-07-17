import { useQuery } from "@tanstack/react-query"
import { BurrowCard } from "@features/burrows/components/BurrowCard.tsx"
import { useNavigate } from "react-router"
import { getBurrows } from "@features/burrows/burrows.api.ts"
import { Badge, Button, Card, ViewErrors } from "@umnburrow/core"

/**
 * {@link PreviewBurrows}
 */
type PreviewGroupsProps = {
    amount: number
}

/**
 * Preview a list of Burrows
 *
 * @param amount The amount of Burrows to preview.
 *
 * @author AJ Kneisl
 */
export default function PreviewBurrows({ amount }: PreviewGroupsProps) {
    const nav = useNavigate()

    const { data, isLoading, isError, refetch, error } = useQuery({
        queryKey: ["preview"],
        queryFn: async () => getBurrows(null, true)
    })

    return (
        <div className="flex flex-col items-center justify-center gap-2 overflow-auto">
            <div className="flex w-full items-center gap-3">
                <h3 className="text-text/60 text-sm font-semibold tracking-wide uppercase">
                    Upcoming Burrows
                </h3>

                <span className="border-card-border flex-1 border-t" />
            </div>

            {/* error */}
            {isError && (
                <div className="w-full">
                    <ViewErrors clearErrors={refetch} errors={[`${error}`]} />
                </div>
            )}

            {/* loading skeleton */}
            {!isError &&
                (isLoading || !data) &&
                Array.from({ length: amount }).map((_, i) => (
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

            {/* display burrows */}
            {data &&
                data.contents &&
                data.contents.length > 0 &&
                data.contents
                    .slice(0, amount)
                    .map((meeting) => (
                        <BurrowCard
                            key={meeting.burrow.id}
                            meetingResponse={meeting}
                        />
                    ))}

            {/* no upcoming burrows */}
            {data && data.contents?.length === 0 && (
                <Card
                    aria-live="polite"
                    aria-label="No upcoming meetings"
                    className="border-card-border flex h-24 w-full items-center justify-center border-2 border-dashed"
                >
                    <p className="text-text/50 text-center text-sm tracking-wide">
                        No upcoming Burrows.
                    </p>
                </Card>
            )}

            {!isError && (
                <Button className="w-full" onClick={() => nav(`/browse`)}>
                    Browse
                </Button>
            )}
        </div>
    )
}
