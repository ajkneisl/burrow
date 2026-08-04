
import { BurrowResponse, getAttendees } from "@umnburrow/core/api"
import type { BurrowMembershipResponse } from "@umnburrow/core/api"
import { useQuery } from "@tanstack/react-query"

import { Pressable, View } from "react-native"
import { ProfilePicture } from "@features/profile/components/ProfilePicture"
import { Card, Chip, Modal, Button, Text } from "@components/core"
import { useRouter } from "expo-router"
import { AttendeeActionsModal } from "@features/burrows/attendees/AttendeeActionsModal"
import { useState } from "react"
import useUser from "@features/auth/hooks/useUser"
import { useThemeColors } from "@api/theme/useThemeColors"
import {
    ChevronLeft,
    ChevronRight,
    Crown,
    Shield
} from "lucide-react-native"
import ThemedIcon from "@components/core/ThemedIcon"

const ITEMS_PER_PAGE = 6

/**
 * {@link Attendees}
 */
type AttendeesProps = {
    data: BurrowResponse
    /** Render without Card wrapper, filling available space */
    fullScreen?: boolean
}

/**
 * The attendees in a Burrow.
 *
 * @author AJ Kneisl
 */
export default function Attendees({ data, fullScreen }: AttendeesProps) {
    const router = useRouter()
    const currentUser = useUser()
    const colors = useThemeColors()

    const isModerator =
        data.membership?.role === "MODERATOR" ||
        currentUser?.id === data.burrow.ownerID

    const [attendeeActionsModalOpen, setAttendeeActionsModalOpen] =
        useState(false)
    const [selectedAttendee, setSelectedAttendee] =
        useState<BurrowMembershipResponse | null>(null)
    const [page, setPage] = useState(0)

    const { data: attendeesData } = useQuery({
        queryKey: ["attendees", data.burrow.id],
        queryFn: async () => await getAttendees(data.burrow.id!)
    })

    if (!attendeesData) return <Text>Loading</Text>

    const totalPages = Math.ceil(attendeesData.contents.length / ITEMS_PER_PAGE)
    const paginatedAttendees = attendeesData.contents.slice(
        page * ITEMS_PER_PAGE,
        (page + 1) * ITEMS_PER_PAGE
    )

    const getRoleBadge = (role: string) => {
        if (role === "HOST")
            return <Chip size="sm" color="primary" icon={Crown} label="Host" />
        if (role === "MODERATOR")
            return <Chip size="sm" color="info" icon={Shield} label="Mod" />
        return null
    }

    const content = (
        <>
            {/* header */}
            <View className={`flex-row items-center justify-between ${fullScreen ? "px-6 pt-4 pb-2" : "mb-3"}`}>
                <Text className="text-lg font-bold text-text">
                    {data.burrow.kind === "PROJECT"
                        ? "Team Members"
                        : "Attendees"}
                </Text>
                <Text className="text-sm text-text text-opacity-50">
                    {attendeesData.contents.length} total
                </Text>
            </View>

            {/* attendees */}
            <View className={fullScreen ? "px-6" : ""}>
                {paginatedAttendees.map(
                    (item: BurrowMembershipResponse, index: number) => (
                        <Pressable
                            key={item.user.id}
                            onPress={() =>
                                router.push(`/user/${item.user.username}`)
                            }
                            onLongPress={() => {
                                if (
                                    isModerator &&
                                    item.user.id !== currentUser?.id
                                ) {
                                    setSelectedAttendee(item)
                                    setAttendeeActionsModalOpen(true)
                                }
                            }}
                            className={`flex-row items-center py-3 active:opacity-60 ${
                                index < paginatedAttendees.length - 1
                                    ? "border-b border-card-border"
                                    : ""
                            }`}
                        >
                            <ProfilePicture
                                name={
                                    item.profile.name || item.user.username
                                }
                                userID={item.user.id}
                                size="md"
                            />

                            <View className="flex-1 ml-3">
                                <View className="flex-row items-center gap-2">
                                    <Text
                                        className="text-text font-semibold"
                                        numberOfLines={1}
                                    >
                                        {item.profile.name ||
                                            item.user.username}
                                    </Text>
                                    {getRoleBadge(item.membership.role)}
                                </View>
                                <Text className="text-sm text-text text-opacity-50">
                                    @{item.user.username}
                                </Text>
                            </View>

                            <ThemedIcon
                                icon={ChevronRight}
                                size={16}
                                opacity={0.3}
                            />
                        </Pressable>
                    )
                )}
            </View>

            {/* paginator */}
            {totalPages > 1 && (
                <View className={`flex-row items-center justify-between mt-3 pt-3 border-t border-card-border ${fullScreen ? "px-6" : ""}`}>
                    <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                    >
                        <View className="flex-row items-center gap-1">
                            <ThemedIcon icon={ChevronLeft} size={14} />
                            <Text className="text-sm text-text">Prev</Text>
                        </View>
                    </Button>

                    <Text className="text-xs text-text text-opacity-50">
                        {page + 1} / {totalPages}
                    </Text>

                    <Button
                        variant="ghost"
                        size="sm"
                        onPress={() =>
                            setPage((p) => Math.min(totalPages - 1, p + 1))
                        }
                        disabled={page === totalPages - 1}
                    >
                        <View className="flex-row items-center gap-1">
                            <Text className="text-sm text-text">Next</Text>
                            <ThemedIcon icon={ChevronRight} size={14} />
                        </View>
                    </Button>
                </View>
            )}
        </>
    )

    return (
        <>
            {/* manage attendee */}
            <Modal
                visible={attendeeActionsModalOpen}
                onClose={() => {
                    setAttendeeActionsModalOpen(false)
                    setSelectedAttendee(null)
                }}
                title={`Manage Member: @${selectedAttendee?.user?.username}`}
                size="lg"
                centered
                scrollable={false}
            >
                {data.burrow.id && selectedAttendee && data?.membership && (
                    <AttendeeActionsModal
                        burrowID={data.burrow.id}
                        attendee={selectedAttendee}
                        currentUserRole={data.membership.role}
                        onClose={() => {
                            setAttendeeActionsModalOpen(false)
                            setSelectedAttendee(null)
                        }}
                    />
                )}
            </Modal>

            {fullScreen ? content : <Card variant="bordered">{content}</Card>}
        </>
    )
}
