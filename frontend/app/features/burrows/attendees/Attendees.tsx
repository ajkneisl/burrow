import {
    type BurrowMembershipResponse,
    BurrowResponse
} from "@features/burrows/burrows.types"
import { useQuery } from "@tanstack/react-query"
import { getAttendees } from "@features/burrows/burrows.api"
import { Pressable, Text, View } from "react-native"
import { ProfilePicture } from "@features/profile/components/ProfilePicture"
import { Card, Modal, Button } from "@components/core"
import { useRouter } from "expo-router"
import { AttendeeActionsModal } from "@features/burrows/attendees/AttendeeActionsModal"
import { useState } from "react"
import useUser from "@features/auth/hooks/useUser"
import { useThemeColors } from "@api/theme/useThemeColors"
import {
    ChevronLeft,
    ChevronRight,
    Crown,
    Shield,
    Users
} from "lucide-react-native"
import ThemedIcon from "@components/core/ThemedIcon"

const ITEMS_PER_PAGE = 6

/**
 * {@link Attendees}
 */
type AttendeesProps = {
    data: BurrowResponse
}

/**
 * The attendees in a Burrow.
 *
 * @author AJ Kneisl
 */
export default function Attendees({ data }: AttendeesProps) {
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
        if (role === "HOST") {
            return (
                <View
                    className="flex-row items-center px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${colors.primary}20` }}
                >
                    <ThemedIcon
                        icon={Crown}
                        size={10}
                        overrideColor="primary"
                    />
                    <Text
                        className="text-xs font-semibold ml-1"
                        style={{ color: colors.primary }}
                    >
                        Host
                    </Text>
                </View>
            )
        }
        if (role === "MODERATOR") {
            return (
                <View
                    className="flex-row items-center px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${colors.info}20` }}
                >
                    <ThemedIcon icon={Shield} size={10} overrideColor="info" />
                    <Text
                        className="text-xs font-semibold ml-1"
                        style={{ color: colors.info }}
                    >
                        Mod
                    </Text>
                </View>
            )
        }
        return null
    }

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

            <Card variant="bordered">
                {/* header */}
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center gap-2">
                        <View
                            className="w-8 h-8 rounded-full items-center justify-center"
                            style={{ backgroundColor: `${colors.primary}20` }}
                        >
                            <ThemedIcon
                                icon={Users}
                                size={16}
                                overrideColor="primary"
                            />
                        </View>
                        <View>
                            <Text className="text-lg font-bold text-text">
                                {data.burrow.kind === "PROJECT"
                                    ? "Team Members"
                                    : "Attendees"}
                            </Text>
                            <Text className="text-xs text-text text-opacity-60">
                                {attendeesData.contents.length} total
                            </Text>
                        </View>
                    </View>
                </View>

                {/* attendees */}
                <View className="gap-2">
                    {paginatedAttendees.map(
                        (item: BurrowMembershipResponse) => (
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
                                className="flex-row items-center p-3 rounded-xl bg-card active:bg-card-border"
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
                                    size={18}
                                    opacity={0.4}
                                />
                            </Pressable>
                        )
                    )}
                </View>

                {/* paginator */}
                {totalPages > 1 && (
                    <View className="flex-row items-center justify-between mt-4 pt-4 border-t border-card-border">
                        <Button
                            variant="ghost"
                            size="sm"
                            onPress={() => setPage((p) => Math.max(0, p - 1))}
                            disabled={page === 0}
                        >
                            <View className="flex-row items-center gap-1">
                                <ThemedIcon
                                    icon={ChevronLeft}
                                    size={16}
                                    overrideColor={
                                        page === 0 ? "secondary" : undefined
                                    }
                                />

                                <Text
                                    style={{
                                        color:
                                            page === 0
                                                ? colors.secondary
                                                : colors.text
                                    }}
                                >
                                    Prev
                                </Text>
                            </View>
                        </Button>

                        <Text className="text-sm text-text text-opacity-60">
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
                                <Text
                                    style={{
                                        color:
                                            page === totalPages - 1
                                                ? colors.secondary
                                                : colors.text
                                    }}
                                >
                                    Next
                                </Text>

                                <ThemedIcon
                                    icon={ChevronRight}
                                    size={16}
                                    overrideColor={
                                        page === totalPages - 1
                                            ? "secondary"
                                            : undefined
                                    }
                                />
                            </View>
                        </Button>
                    </View>
                )}
            </Card>
        </>
    )
}
