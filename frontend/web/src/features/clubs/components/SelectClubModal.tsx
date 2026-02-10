import { useQuery } from "@tanstack/react-query"
import { getMyClubs } from "@features/clubs/clubs.api.ts"
import type { MyClubResponse } from "@features/clubs/clubs.types.ts"
import { Modal, Card } from "@umnburrow/core"
import { Users } from "lucide-react"

type SelectClubModalProps = {
    open: boolean
    onClose: () => void
    onSelect: (clubID: string) => void
}

export default function SelectClubModal({ open, onClose, onSelect }: SelectClubModalProps) {
    const { data, isLoading } = useQuery<MyClubResponse[]>({
        queryKey: ["myClubs"],
        enabled: open,
        queryFn: async () => await getMyClubs()
    })

    const adminClubs = (data ?? []).filter((item) => item.membership.role === "ADMINISTRATOR")

    return (
        <Modal open={open} onClose={onClose} title="Select a Club" widthClass="md:min-w-md max-w-md">
            {isLoading && (
                <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <Card key={i} className="p-4">
                            <div className="bg-text/10 h-5 w-40 animate-pulse rounded" />
                            <div className="bg-text/10 mt-2 h-3 w-24 animate-pulse rounded" />
                        </Card>
                    ))}
                </div>
            )}

            {!isLoading && adminClubs.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <Users className="text-text/30 h-10 w-10" />
                    <p className="text-text/60 text-sm">
                        You must be an administrator of a club to create a club meeting.
                    </p>
                </div>
            )}

            {!isLoading && adminClubs.length > 0 && (
                <div className="space-y-2">
                    {adminClubs.map((item) => (
                        <Card
                            key={item.club.id}
                            className="cursor-pointer p-4 transition-shadow hover:shadow-md"
                            onClick={() => onSelect(item.club.id)}
                        >
                            <h3 className="text-text text-sm font-semibold">
                                {item.club.displayName}
                            </h3>
                            <p className="text-text/50 mt-0.5 text-xs">
                                {item.club.category.charAt(0) +
                                    item.club.category.slice(1).toLowerCase()}
                            </p>
                        </Card>
                    ))}
                </div>
            )}
        </Modal>
    )
}
