import { getMyClubs } from "@umnburrow/core/api"
import type { MyClubResponse } from "@umnburrow/core/api"
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Modal, Card, Button } from "@umnburrow/core"
import { Plus, Users } from "lucide-react"
import CreateClubModal from "@features/clubs/components/CreateClubModal.tsx"
import { Heading, Button as AriaButton } from "react-aria-components"

type SelectClubModalProps = {
    open: boolean
    onClose: () => void
    onSelect: (clubID: string) => void
}

export default function SelectClubModal({
    open,
    onClose,
    onSelect
}: SelectClubModalProps) {
    const [createOpen, setCreateOpen] = useState(false)

    const { data, isLoading } = useQuery<MyClubResponse[]>({
        queryKey: ["myClubs"],
        enabled: open,
        queryFn: async () => await getMyClubs()
    })

    const adminClubs = (data ?? []).filter(
        (item) => item.membership.role === "ADMINISTRATOR"
    )

    return (
        <Modal open={open} onClose={onClose} widthClass="md:min-w-md max-w-md">
            <header className="flex items-center justify-between gap-4 px-6 py-5">
                <Heading
                    slot="title"
                    className="text-xl font-semibold tracking-tight"
                >
                    Select a Club
                </Heading>

                <div className="flex flex-row gap-2">
                    <Button color="SECONDARY" onClick={() => setCreateOpen(true)}>
                        <Plus />
                        Create
                    </Button>

                    <AriaButton
                        onPress={onClose}
                        className="-mr-2 grid size-9 cursor-pointer place-items-center rounded-full text-text/60 transition-colors hover:bg-text/10 hover:text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        aria-label="Close modal"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="size-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                        >
                            <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                    </AriaButton>
                </div>
            </header>

            {isLoading && (
                <div className="space-y-3">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <Card key={i} className="p-4">
                            <div className="h-5 w-40 animate-pulse rounded bg-text/10" />
                            <div className="mt-2 h-3 w-24 animate-pulse rounded bg-text/10" />
                        </Card>
                    ))}
                </div>
            )}

            {!isLoading && adminClubs.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <Users className="size-10 text-text/30" />
                    <p className="text-sm text-text/60">
                        You must be an administrator of a club to create a club
                        meeting.
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
                            <h3 className="text-sm font-semibold text-text">
                                {item.club.displayName}
                            </h3>
                            <p className="mt-0.5 text-xs text-text/50">
                                {item.club.category.charAt(0) +
                                    item.club.category.slice(1).toLowerCase()}
                            </p>
                        </Card>
                    ))}
                </div>
            )}

            <CreateClubModal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
            />
        </Modal>
    )
}
