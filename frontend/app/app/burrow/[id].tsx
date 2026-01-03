import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    Share as RNShare,
    RefreshControl
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter, Stack } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback } from "react"
import { useAtom } from "jotai"
import {
    Calendar,
    MapPin,
    Users,
    Clock,
    ChevronLeft,
    Share2,
    Archive,
    BookOpen,
    Edit2,
    Trash2,
    Settings,
    UserPlus,
    ListChecks
} from "lucide-react-native"
import { Button, Card, Modal } from "@components/core"
import { formatDateTime, dayLabel } from "@api/util"
import {
    getBurrow,
    joinBurrow,
    leaveBurrow,
    getAttendees,
    deleteMeeting
} from "@features/burrows/burrows.api"
import useUser from "@features/auth/hooks/useUser"
import Toast from "react-native-toast-message"
import { BurrowChat } from "@features/chat/components/BurrowChat"
import type { BurrowMembershipResponse } from "@features/burrows/burrows.types"
import { CreateBurrowWizard } from "@features/burrows/create/CreateBurrowWizard"
import type { SubmittedBurrowFormState } from "@features/burrows/create/create.types"
import { BurrowFeaturesModal } from "@features/sync/components/BurrowFeaturesModal"
import { Pomodoro } from "@features/sync/components/Pomodoro"
import { InviteUserModal } from "@features/burrows/invites/InviteUserModal"
import { ManageInvitesModal } from "@features/burrows/invites/ManageInvitesModal"
import { AttendeeActionsModal } from "@features/burrows/attendees/AttendeeActionsModal"
import { blockStatus } from "@features/sync/sync.atom"
import useSync from "@features/sync/hooks/useSync"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * Burrow details screen
 *
 * @author AJ Kneisl
 */
export default function BurrowDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()
    const queryClient = useQueryClient()
    const currentUser = useUser()
    const colors = useThemeColors()

    const [blocks] = useAtom(blockStatus)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [featuresModalOpen, setFeaturesModalOpen] = useState(false)
    const [inviteModalOpen, setInviteModalOpen] = useState(false)
    const [manageInvitesModalOpen, setManageInvitesModalOpen] = useState(false)
    const [attendeeActionsModalOpen, setAttendeeActionsModalOpen] =
        useState(false)
    const [selectedAttendee, setSelectedAttendee] =
        useState<BurrowMembershipResponse | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["burrow", id],
        queryFn: async () => await getBurrow(id!),
        enabled: !!id
    })

    const { data: attendeesData, refetch: refetchAttendees } = useQuery({
        queryKey: ["attendees", id],
        queryFn: async () => await getAttendees(id!),
        enabled: !!id && !!data?.membership
    })

    // Burrow membership and sync
    const isMember =
        data?.membership?.status === "JOINED" ||
        currentUser?.id === data?.burrow.ownerID

    // WebSocket sync for real-time features (chat, pomodoro, etc.)
    useSync(data?.burrow?.id ?? null, isMember)

    // join burrow mutation
    const joinMutation = useMutation({
        mutationFn: async () => await joinBurrow(id!),

        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["burrow", id] })
            void queryClient.invalidateQueries({ queryKey: ["schedule"] })

            Toast.show({
                type: "success",
                text1: "Joined Burrow!"
            })
        },

        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Failed to join",
                text2: error.message || "Please try again"
            })
        }
    })

    // leave burrow mutation
    const leaveMutation = useMutation({
        mutationFn: async () => await leaveBurrow(id!),

        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["burrow", id] })
            await queryClient.invalidateQueries({ queryKey: ["schedule"] })
            Toast.show({
                type: "success",
                text1: "Left burrow"
            })
            router.back()
        },

        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Failed to leave",
                text2: error.message || "Please try again"
            })
        }
    })

    // delete burrow mutation
    const deleteMutation = useMutation({
        mutationFn: async () => await deleteMeeting(id!),

        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["burrows"] })
            await queryClient.invalidateQueries({ queryKey: ["schedule"] })

            Toast.show({
                type: "success",
                text1: "Burrow deleted"
            })
            router.back()
        },

        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Failed to delete",
                text2: error.message || "Please try again"
            })
        }
    })

    // share
    const handleShare = async () => {
        try {
            await RNShare.share({
                message: `Check out this Burrow: ${data?.burrow.title}`,
                url: `https://umn.app/${id}`
            })
        } catch {
            // User cancelled share
        }
    }

    // Handle pull-to-refresh
    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        try {
            await Promise.all([refetch(), refetchAttendees()])
        } finally {
            setRefreshing(false)
        }
    }, [refetch, refetchAttendees])

    // Convert burrow data to form state for editing
    const getInitialFormData = useCallback(():
        | Partial<SubmittedBurrowFormState>
        | undefined => {
        if (!data?.burrow) return undefined

        const burrow = data.burrow

        if (burrow.kind === "PROJECT") {
            return {
                kind: "PROJECT",
                name: burrow.title,
                objective: burrow.description,
                className: burrow.className || "",
                teamMembers: [], // Would need to fetch from attendees
                dueDate: new Date(burrow.endTime)
            }
        } else {
            // Study/Event/Club
            const beginDateTime = new Date(burrow.beginningTime)
            const endDateTime = new Date(burrow.endTime)

            return {
                kind: burrow.kind,
                title: burrow.title,
                description: burrow.description,
                location: burrow.location,
                date: new Date(burrow.beginningTime),
                beginningTime: beginDateTime,
                endTime: endDateTime,
                tags: burrow.tags?.join(", ") || "",
                capacity: burrow.capacity || 0,
                visibility: burrow.visibility,
                requestToJoin: burrow.requestToJoin
            }
        }
    }, [data])

    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        )
    }

    if (isError || !data?.burrow) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-text text-opacity-60 text-lg mb-4">
                        Failed to load burrow
                    </Text>
                    <Button onPress={() => router.back()}>Go Back</Button>
                </View>
            </SafeAreaView>
        )
    }

    const burrow = data.burrow
    const isOwner = currentUser?.id === burrow.ownerID
    const isModerator = data.membership?.role === "MODERATOR"
    const isHostOrMod = isOwner || isModerator
    const isPast = burrow.endTime < Date.now()
    const isProject = burrow.kind === "PROJECT"

    const kindColors = {
        STUDY: "bg-info/10 text-info",
        EVENT: "bg-success/10 text-success",
        CLUB: "bg-warn/10 text-warn",
        PROJECT: "bg-primary/10 text-primary"
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 py-4 border-b border-card-border flex-row items-center justify-between">
                <Pressable onPress={() => router.back()} className="p-2 -ml-2">
                    <ChevronLeft size={28} color={colors.text} />
                </Pressable>
                <Pressable onPress={handleShare} className="p-2 -mr-2">
                    <Share2 size={24} color={colors.text} />
                </Pressable>
            </View>

            <ScrollView
                className="flex-1"
                nestedScrollEnabled={true}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                        colors={[colors.primary]}
                    />
                }
            >
                {/* Title & Type */}
                <View className="px-6 pt-6 pb-4">
                    {isPast && (
                        <View className="bg-card dark:bg-card rounded-lg px-3 py-2 mb-3 flex-row items-center">
                            <Archive
                                size={16}
                                color={colors.text}
                                style={{ opacity: 0.6 }}
                            />
                            <Text className="text-text dark:text-text opacity-70 text-sm ml-2 font-medium">
                                This{" "}
                                {isProject
                                    ? "project is past due"
                                    : "burrow has ended"}
                            </Text>
                        </View>
                    )}

                    <View className="flex-row items-start justify-between mb-3">
                        <Text className="text-3xl font-bold text-text flex-1 mr-4">
                            {burrow.title}
                        </Text>
                        <View
                            className={`px-3 py-1.5 rounded-full ${kindColors[burrow.kind]}`}
                        >
                            <Text className="text-xs font-semibold">
                                {burrow.kind}
                            </Text>
                        </View>
                    </View>

                    {/* Host */}
                    <Pressable
                        onPress={() =>
                            router.push(`/user/${data.burrowAuthor}`)
                        }
                        className="flex-row items-center mb-3"
                    >
                        <View className="bg-primary rounded-full w-10 h-10 items-center justify-center mr-3">
                            <Text className="text-white font-bold text-base">
                                {data.burrowAuthor?.[0]?.toUpperCase() || "?"}
                            </Text>
                        </View>
                        <View>
                            <Text className="text-sm text-text text-opacity-60">
                                {isProject ? "Created by" : "Hosted by"}
                            </Text>
                            <Text className="text-base text-text font-semibold">
                                {data.burrowAuthorProfile?.name ||
                                    data.burrowAuthor}
                            </Text>
                        </View>
                    </Pressable>
                </View>

                <View className="px-6 space-y-4 gap-4">
                    {/* Owner/Moderator Controls */}
                    {isOwner && !isPast && (
                        <Card variant="bordered">
                            <View className="space-y-2 gap-2">
                                <View className="flex-row gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        leftIcon={
                                            <Edit2
                                                size={16}
                                                color={colors.primary}
                                            />
                                        }
                                        onPress={() => setEditModalOpen(true)}
                                        className="flex-1"
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        leftIcon={
                                            <Settings
                                                size={16}
                                                color={colors.primary}
                                            />
                                        }
                                        onPress={() =>
                                            setFeaturesModalOpen(true)
                                        }
                                        className="flex-1"
                                    >
                                        Features
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        leftIcon={
                                            <Trash2
                                                size={16}
                                                color={colors.error}
                                            />
                                        }
                                        onPress={() => deleteMutation.mutate()}
                                        loading={deleteMutation.isPending}
                                        className="flex-1"
                                    >
                                        Delete
                                    </Button>
                                </View>

                                <View className="flex-row gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        leftIcon={
                                            <UserPlus
                                                size={16}
                                                color={colors.secondary}
                                            />
                                        }
                                        onPress={() => setInviteModalOpen(true)}
                                        className="flex-1"
                                    >
                                        Invite User
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        leftIcon={
                                            <ListChecks
                                                size={16}
                                                color={colors.info}
                                            />
                                        }
                                        onPress={() =>
                                            setManageInvitesModalOpen(true)
                                        }
                                        className="flex-1"
                                    >
                                        Manage Invites
                                    </Button>
                                </View>
                            </View>
                        </Card>
                    )}

                    {/* Project Status Badge */}
                    {isProject && (
                        <Card
                            variant="bordered"
                            className={`${
                                isPast
                                    ? "bg-error bg-opacity-10 border-error border-opacity-30"
                                    : "bg-success bg-opacity-10 border-success border-opacity-30"
                            }`}
                        >
                            <View className="flex-row items-center justify-between">
                                <Text
                                    className={`font-semibold ${
                                        isPast ? "text-error" : "text-success"
                                    }`}
                                >
                                    {isPast ? "⚠️ Overdue" : "✅ In Progress"}
                                </Text>
                                {isPast && (
                                    <Text className="text-text text-opacity-60 text-sm">
                                        Due {dayLabel(burrow.endTime)}
                                    </Text>
                                )}
                            </View>
                        </Card>
                    )}

                    {/* Details Card */}
                    <Card variant="bordered">
                        <Text className="text-lg font-semibold text-text mb-3">
                            Details
                        </Text>
                        <View className="space-y-3">
                            {isProject ? (
                                <>
                                    {burrow.className && (
                                        <DetailRow
                                            icon={
                                                <BookOpen
                                                    size={20}
                                                    color={colors.secondary}
                                                />
                                            }
                                            label="Course"
                                            value={burrow.className}
                                        />
                                    )}
                                    <DetailRow
                                        icon={
                                            <Calendar
                                                size={20}
                                                color={colors.primary}
                                            />
                                        }
                                        label="Due Date"
                                        value={dayLabel(burrow.endTime)}
                                    />
                                </>
                            ) : (
                                <>
                                    <DetailRow
                                        icon={
                                            <Clock
                                                size={20}
                                                color={colors.primary}
                                            />
                                        }
                                        label="When"
                                        value={formatDateTime(
                                            burrow.beginningTime,
                                            burrow.endTime
                                        )}
                                    />
                                    {burrow.location && (
                                        <DetailRow
                                            icon={
                                                <MapPin
                                                    size={20}
                                                    color={colors.primary}
                                                />
                                            }
                                            label="Where"
                                            value={burrow.location}
                                        />
                                    )}
                                </>
                            )}

                            <DetailRow
                                icon={
                                    <Users size={20} color={colors.primary} />
                                }
                                label={isProject ? "Team Size" : "Capacity"}
                                value={`${burrow.joined || 0}${burrow.capacity ? `/${burrow.capacity}` : ""} ${isProject ? "members" : "joined"}`}
                            />
                        </View>
                    </Card>

                    {/* Description/Objective */}
                    {burrow.description && (
                        <Card variant="bordered">
                            <Text className="text-lg font-semibold text-text mb-3">
                                {isProject ? "Objective" : "Description"}
                            </Text>
                            <Text className="text-text text-opacity-80 leading-6">
                                {burrow.description}
                            </Text>
                        </Card>
                    )}

                    {/* Tags - with gap from description */}
                    {burrow.tags && burrow.tags.length > 0 && (
                        <Card variant="bordered" className="mt-2">
                            <Text className="text-lg font-semibold text-text mb-3">
                                Tags
                            </Text>
                            <View className="flex-row flex-wrap gap-2">
                                {burrow.tags.map((tag, index) => (
                                    <View
                                        key={index}
                                        className="bg-card dark:bg-card px-3 py-1.5 rounded-md"
                                    >
                                        <Text className="text-sm text-text dark:text-text">
                                            {tag}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </Card>
                    )}

                    {/* Pomodoro Timer - Only show if member and block enabled */}
                    {isMember &&
                        blocks.includes("POMODORO") &&
                        data.membership && (
                            <Pomodoro
                                burrowId={id}
                                userRole={data.membership.role}
                            />
                        )}

                    {/* Chat - Only show if member and block enabled */}
                    {isMember && blocks.includes("CHAT") && (
                        <BurrowChat burrowId={id} isMember={isMember} />
                    )}

                    {/* Attendees/Members - Only show if member */}
                    {isMember &&
                        attendeesData &&
                        attendeesData.contents.length > 0 && (
                            <Card variant="bordered">
                                <Text className="text-lg font-semibold text-text mb-3">
                                    {isProject ? "Team Members" : "Attendees"} (
                                    {attendeesData.contents.length})
                                </Text>
                                <View className="space-y-2">
                                    {attendeesData.contents
                                        .slice(0, 10)
                                        .map(
                                            (
                                                item: BurrowMembershipResponse
                                            ) => (
                                                <Pressable
                                                    key={item.user.id}
                                                    onPress={() =>
                                                        router.push(
                                                            `/user/${item.user.username}`
                                                        )
                                                    }
                                                    onLongPress={() => {
                                                        if (
                                                            isHostOrMod &&
                                                            item.user.id !==
                                                                currentUser?.id
                                                        ) {
                                                            setSelectedAttendee(
                                                                item
                                                            )
                                                            setAttendeeActionsModalOpen(
                                                                true
                                                            )
                                                        }
                                                    }}
                                                    className="flex-row items-center py-2"
                                                >
                                                    <View className="bg-primary rounded-full w-10 h-10 items-center justify-center mr-3">
                                                        <Text className="text-white font-bold text-sm">
                                                            {item.user.username?.[0]?.toUpperCase() ||
                                                                "?"}
                                                        </Text>
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-text font-medium">
                                                            {item.profile
                                                                .name ||
                                                                item.user
                                                                    .username}
                                                        </Text>
                                                        <Text className="text-sm text-text text-opacity-60">
                                                            @
                                                            {item.user.username}
                                                            {item.membership
                                                                .role ===
                                                                "HOST" &&
                                                                " • Host"}
                                                            {item.membership
                                                                .role ===
                                                                "MODERATOR" &&
                                                                " • Moderator"}
                                                        </Text>
                                                    </View>
                                                </Pressable>
                                            )
                                        )}
                                </View>
                                {attendeesData.contents.length > 10 && (
                                    <Text className="text-sm text-text text-opacity-60 mt-2">
                                        And {attendeesData.contents.length - 10}{" "}
                                        more...
                                    </Text>
                                )}
                            </Card>
                        )}

                    {/* Request to Join Notice */}
                    {!isMember && burrow.requestToJoin && (
                        <Card variant="bordered" className="bg-info/5">
                            <View className="flex-row items-start">
                                <BookOpen
                                    size={20}
                                    color={colors.primary}
                                    className="mt-0.5 mr-3"
                                />
                                <View className="flex-1">
                                    <Text className="text-text font-semibold mb-1">
                                        Request to Join
                                    </Text>
                                    <Text className="text-text text-opacity-60 text-sm">
                                        This burrow requires approval to join.
                                        Your request will be reviewed by the
                                        host.
                                    </Text>
                                </View>
                            </View>
                        </Card>
                    )}

                    {/* Spacer for bottom button */}
                    <View className="h-24" />
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            {!isPast && (
                <View className="px-6 py-4 border-t border-card-border bg-background">
                    {isMember && !isHostOrMod ? (
                        <Button
                            variant="outline"
                            size="lg"
                            fullWidth
                            onPress={() => leaveMutation.mutate()}
                            loading={leaveMutation.isPending}
                        >
                            {isProject ? "Leave Project" : "Leave Burrow"}
                        </Button>
                    ) : !isMember ? (
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onPress={() => joinMutation.mutate()}
                            loading={joinMutation.isPending}
                        >
                            {burrow.requestToJoin
                                ? "Request to Join"
                                : isProject
                                  ? "Join Project"
                                  : "Join Burrow"}
                        </Button>
                    ) : null}
                </View>
            )}

            {/* Edit Burrow Modal */}
            <Modal
                visible={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                size="full"
            >
                {data?.burrow && (
                    <CreateBurrowWizard
                        onClose={() => setEditModalOpen(false)}
                        burrowType={data.burrow.kind}
                        mode="update"
                        burrowId={id}
                        initialData={getInitialFormData()}
                    />
                )}
            </Modal>

            {/* Burrow Features Modal */}
            <Modal
                visible={featuresModalOpen}
                onClose={() => setFeaturesModalOpen(false)}
                size="md"
                scrollable={false}
            >
                {id && (
                    <BurrowFeaturesModal
                        burrowId={id}
                        currentBlocks={blocks}
                        onClose={() => setFeaturesModalOpen(false)}
                    />
                )}
            </Modal>

            {/* Invite User Modal */}
            <Modal
                visible={inviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
                size="full"
            >
                {id && (
                    <InviteUserModal
                        burrowId={id}
                        onClose={() => setInviteModalOpen(false)}
                    />
                )}
            </Modal>

            {/* Manage Invites Modal */}
            <Modal
                visible={manageInvitesModalOpen}
                onClose={() => setManageInvitesModalOpen(false)}
                size="full"
            >
                {id && (
                    <ManageInvitesModal
                        burrowId={id}
                        onClose={() => setManageInvitesModalOpen(false)}
                    />
                )}
            </Modal>

            {/* Attendee Actions Modal */}
            <Modal
                visible={attendeeActionsModalOpen}
                onClose={() => {
                    setAttendeeActionsModalOpen(false)
                    setSelectedAttendee(null)
                }}
                size="md"
                presentationStyle="pageSheet"
            >
                {id && selectedAttendee && data?.membership && (
                    <AttendeeActionsModal
                        burrowId={id}
                        attendee={selectedAttendee}
                        currentUserRole={data.membership.role}
                        onClose={() => {
                            setAttendeeActionsModalOpen(false)
                            setSelectedAttendee(null)
                        }}
                    />
                )}
            </Modal>
        </SafeAreaView>
    )
}

function DetailRow({
    icon,
    label,
    value
}: {
    icon: React.ReactNode
    label: string
    value: string
}) {
    return (
        <View className="flex-row items-start">
            <View className="mr-3 mt-0.5">{icon}</View>
            <View className="flex-1">
                <Text className="text-sm text-text text-opacity-60 mb-0.5">
                    {label}
                </Text>
                <Text className="text-base text-text font-medium">{value}</Text>
            </View>
        </View>
    )
}
