import {
    View,
    Text,
    ScrollView,
    Pressable,
    ActivityIndicator,
    RefreshControl
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter, Stack } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback } from "react"
import { useAtom } from "jotai"
import {
    Users,
    Clock,
    ChevronLeft,
    Archive,
    BookOpen,
    Edit2,
    Trash2,
    Settings,
    UserPlus,
    ListChecks,
    X,
    GraduationCap,
    EllipsisVertical,
    Flag,
    ShieldBan,
    CircleAlert
} from "lucide-react-native"
import { BURROW_KIND_CONFIG } from "@features/burrows/burrows.types"
import { Button, Card, Modal } from "@components/core"
import { dayLabel } from "@api/util"
import {
    getBurrow,
    joinBurrow,
    leaveBurrow,
    deleteMeeting
} from "@features/burrows/burrows.api"
import { cancelJoinRequest } from "@features/burrows/attendees/attendees.api"
import useUser from "@features/auth/hooks/useUser"
import Toast from "react-native-toast-message"
import { BurrowChat } from "@features/chat/components/BurrowChat"
import { CreateBurrowWizard } from "@features/burrows/create/CreateBurrowWizard"
import type { SubmittedBurrowFormState } from "@features/burrows/create/create.types"
import { BurrowFeaturesModal } from "@features/sync/components/BurrowFeaturesModal"
import { Pomodoro } from "@features/sync/components/Pomodoro"
import { InviteUserModal } from "@features/features/invites/InviteUserModal"
import { ManageInvitesModal } from "@features/features/invites/ManageInvitesModal"
import { blockStatus } from "@features/sync/sync.atom"
import useSync from "@features/sync/hooks/useSync"
import { useThemeColors } from "@api/theme/useThemeColors"
import { ProfilePicture } from "@components/profile/ProfilePicture"
import Share from "@features/burrows/attendees/Share"
import Attendees from "@features/burrows/attendees/Attendees"
import ThemedIcon from "@components/core/ThemedIcon"
import Details from "@features/burrows/attendees/Details"
import KindChip from "@components/burrow/KindChip"
import { BlockUserModal } from "@features/profile/components/BlockUserModal"
import { ReportUserModal } from "@features/profile/components/ReportUserModal"
import { ReportBurrowModal } from "@features/burrows/components/ReportBurrowModal"

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

    // modals
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [featuresModalOpen, setFeaturesModalOpen] = useState(false)
    const [inviteModalOpen, setInviteModalOpen] = useState(false)
    const [manageInvitesModalOpen, setManageInvitesModalOpen] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    // report/block modals
    const [showMenu, setShowMenu] = useState(false)
    const [showBlockModal, setShowBlockModal] = useState(false)
    const [showReportUserModal, setShowReportUserModal] = useState(false)
    const [showReportBurrowModal, setShowReportBurrowModal] = useState(false)

    const { data, isLoading, isError } = useQuery({
        queryKey: ["burrow", id],
        queryFn: async () => await getBurrow(id!),
        enabled: !!id
    })

    // Burrow membership and sync
    const isMember =
        data?.membership?.status === "JOINED" ||
        currentUser?.id === data?.burrow.ownerID

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

    // cancel join request mutation
    const cancelRequestMutation = useMutation({
        mutationFn: async () => await cancelJoinRequest(id!),

        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["burrow", id] })
            Toast.show({
                type: "success",
                text1: "Request cancelled"
            })
        },

        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Failed to cancel request",
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

    // Handle pull-to-refresh
    const handleRefresh = useCallback(async () => {
        setRefreshing(true)

        try {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["burrow", id] }),
                queryClient.invalidateQueries({ queryKey: ["attendees", id] })
            ])
        } finally {
            setRefreshing(false)
        }
    }, [queryClient, id])

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
                teamMembers: [],
                dueDate: new Date(burrow.endTime)
            }
        } else {
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
                        Failed to load Burrow
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

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />

            {/* header */}
            <View className="px-6 py-4 border-b border-card-border flex-row items-center justify-between">
                {/* back button */}
                <Pressable onPress={() => router.back()} className="p-2 -ml-2">
                    <ThemedIcon icon={ChevronLeft} size={28} />
                </Pressable>

                {/* right actions */}
                <View className="flex-row items-center gap-2">
                    {/* share */}
                    <Share burrowID={burrow.id} title={burrow.title} />

                    {/* three-dot menu (only show if not owner) */}
                    {!isOwner && (
                        <Pressable
                            onPress={() => setShowMenu(true)}
                            className="pr-2 -mr-2 rounded-lg active:bg-card"
                            hitSlop={{
                                top: 10,
                                bottom: 10,
                                left: 10,
                                right: 10
                            }}
                        >
                            <EllipsisVertical size={24} color={colors.text} />
                        </Pressable>
                    )}
                </View>
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
                {/* main burrow info  */}
                <View className="px-6 pt-6 pb-4">
                    {/* archived / past due indicator */}
                    {isPast && (
                        <View className="bg-card dark:bg-card rounded-lg px-3 py-2 mb-3 flex-row items-center">
                            <ThemedIcon
                                icon={Archive}
                                size={16}
                                opacity={0.6}
                            />

                            <Text className="text-text dark:text-text opacity-70 text-sm ml-2 font-medium">
                                This{" "}
                                {isProject
                                    ? "project is past due"
                                    : "Burrow has been archived"}
                            </Text>
                        </View>
                    )}

                    {/* title + kind */}
                    <View className="flex-row items-start justify-between mb-3">
                        <Text className="text-3xl font-bold text-text flex-1 mr-4">
                            {burrow.title}
                        </Text>

                        <KindChip kind={burrow.kind} />
                    </View>

                    {/* burrow host */}
                    <Pressable
                        onPress={() =>
                            router.push(`/user/${data.burrowAuthor}`)
                        }
                        className="flex-row items-center mb-3 gap-2"
                    >
                        <ProfilePicture
                            userID={data.burrow.ownerID}
                            name={data.burrowAuthorProfile?.name ?? "?"}
                            size={"md"}
                        />

                        <View className="flex-1">
                            <Text className="text-sm text-text text-opacity-60">
                                {isProject ? "Created by" : "Hosted by"}
                            </Text>

                            <View className="flex-row items-center gap-2">
                                <Text className="text-base text-text font-semibold">
                                    {data.burrowAuthorProfile?.name ||
                                        data.burrowAuthor}
                                </Text>

                                {/* TA badge */}
                                {data.hostedByTa && (
                                    <View
                                        className="px-2 py-0.5 rounded-full flex-row items-center gap-1"
                                        style={{
                                            backgroundColor: `${colors.info}33`
                                        }}
                                    >
                                        <ThemedIcon
                                            icon={GraduationCap}
                                            size={12}
                                            overrideColor={"info"}
                                        />

                                        <Text
                                            className="text-xs font-bold"
                                            style={{ color: colors.info }}
                                        >
                                            TA
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </Pressable>
                </View>

                <View className="px-6 space-y-4 gap-4">
                    {/* moderation tools */}
                    {isOwner && !isPast && (
                        <Card variant="bordered">
                            <View className="flex-row flex-wrap gap-3 justify-evenly">
                                {/* edit burrow */}
                                <Pressable
                                    onPress={() => setEditModalOpen(true)}
                                    className="items-center"
                                >
                                    <View
                                        className="w-12 h-12 rounded-full items-center justify-center mb-1"
                                        style={{
                                            backgroundColor: `${colors.primary}1A`
                                        }}
                                    >
                                        <ThemedIcon
                                            icon={Edit2}
                                            size={20}
                                            overrideColor="primary"
                                        />
                                    </View>

                                    <Text className="text-xs text-text">
                                        Edit
                                    </Text>
                                </Pressable>

                                {/* manage features */}
                                <Pressable
                                    onPress={() => setFeaturesModalOpen(true)}
                                    className="items-center"
                                >
                                    <View
                                        className="w-12 h-12 rounded-full items-center justify-center mb-1"
                                        style={{
                                            backgroundColor: `${colors.secondary}1A`
                                        }}
                                    >
                                        <ThemedIcon
                                            icon={Settings}
                                            size={20}
                                            overrideColor="secondary"
                                        />
                                    </View>

                                    <Text className="text-xs text-text">
                                        Features
                                    </Text>
                                </Pressable>

                                {/* invite users */}
                                <Pressable
                                    onPress={() => setInviteModalOpen(true)}
                                    className="items-center"
                                >
                                    <View
                                        className="w-12 h-12 rounded-full items-center justify-center mb-1"
                                        style={{
                                            backgroundColor: `${colors.info}1A`
                                        }}
                                    >
                                        <ThemedIcon
                                            icon={UserPlus}
                                            size={20}
                                            overrideColor={"info"}
                                        />
                                    </View>

                                    <Text className="text-xs text-text">
                                        Invite
                                    </Text>
                                </Pressable>

                                {/* manage invites*/}
                                <Pressable
                                    onPress={() =>
                                        setManageInvitesModalOpen(true)
                                    }
                                    className="items-center"
                                >
                                    <View
                                        className="w-12 h-12 rounded-full items-center justify-center mb-1"
                                        style={{
                                            backgroundColor: `${colors.info}1A`
                                        }}
                                    >
                                        <ThemedIcon
                                            icon={ListChecks}
                                            size={20}
                                            overrideColor={"info"}
                                        />
                                    </View>

                                    <Text className="text-xs text-text">
                                        Invites
                                    </Text>
                                </Pressable>

                                {/* delete */}
                                <Pressable
                                    onPress={() => deleteMutation.mutate()}
                                    disabled={deleteMutation.isPending}
                                    className="items-center"
                                >
                                    <View
                                        className="w-12 h-12 rounded-full items-center justify-center mb-1"
                                        style={{
                                            backgroundColor: `${colors.error}1A`
                                        }}
                                    >
                                        <ThemedIcon
                                            icon={Trash2}
                                            size={20}
                                            overrideColor={"error"}
                                        />
                                    </View>

                                    <Text className="text-xs text-text">
                                        Delete
                                    </Text>
                                </Pressable>
                            </View>
                        </Card>
                    )}

                    {/* project status */}
                    {isProject && (
                        <View
                            className="rounded-2xl p-4"
                            style={{
                                backgroundColor: isPast
                                    ? `${colors.error}15`
                                    : `${colors.success}15`,
                                borderWidth: 1,
                                borderColor: isPast
                                    ? `${colors.error}30`
                                    : `${colors.success}30`
                            }}
                        >
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-3">
                                    <View
                                        className="rounded-full p-2"
                                        style={{
                                            backgroundColor: isPast
                                                ? `${colors.error}25`
                                                : `${colors.success}25`
                                        }}
                                    >
                                        <ThemedIcon
                                            size={18}
                                            icon={Clock}
                                            overrideColor={
                                                isPast ? "error" : "success"
                                            }
                                        />
                                    </View>

                                    <View>
                                        <Text
                                            className="font-bold text-base"
                                            style={{
                                                color: isPast
                                                    ? colors.error
                                                    : colors.success
                                            }}
                                        >
                                            {isPast ? "Overdue" : "In Progress"}
                                        </Text>

                                        {isPast && (
                                            <Text className="text-text text-opacity-70 text-sm">
                                                Due {dayLabel(burrow.endTime)}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* details */}
                    <Card variant="bordered">
                        <Text className="text-lg font-semibold text-text mb-4">
                            Details
                        </Text>

                        <Details burrow={burrow} />
                    </Card>

                    {/* description */}
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

                    {/* tags */}
                    {burrow.tags && burrow.tags.length > 0 && (
                        <Card variant="bordered" className="mt-2">
                            <Text className="text-lg font-semibold text-text mb-3">
                                Tags
                            </Text>

                            <View className="flex-row flex-wrap gap-2">
                                {burrow.tags.map((tag, index) => (
                                    <View
                                        key={index}
                                        className="bg-background border-card-border border px-2 py-1 rounded-full"
                                    >
                                        <Text className="text-sm text-text dark:text-text">
                                            {tag}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        </Card>
                    )}

                    {/* pomodoro */}
                    {isMember &&
                        blocks.includes("POMODORO") &&
                        data.membership && (
                            <Pomodoro
                                burrowId={id}
                                userRole={data.membership.role}
                            />
                        )}

                    {/* chat */}
                    {isMember && blocks.includes("CHAT") && (
                        <BurrowChat burrowId={id} isMember={isMember} />
                    )}

                    {/* attendees */}
                    {isMember && burrow && <Attendees data={data} />}

                    {/* Request to Join Notice */}
                    {!isMember &&
                        burrow.requestToJoin &&
                        !data?.requestedToJoin && (
                            <View
                                className="rounded-2xl p-4"
                                style={{
                                    backgroundColor: `${colors.info}15`,
                                    borderWidth: 1,
                                    borderColor: `${colors.info}30`
                                }}
                            >
                                <View className="flex-row items-center gap-3">
                                    <View
                                        className="rounded-full p-2.5"
                                        style={{
                                            backgroundColor: `${colors.info}25`
                                        }}
                                    >
                                        <BookOpen
                                            size={20}
                                            color={colors.info}
                                        />
                                    </View>

                                    <View className="flex-1">
                                        <Text
                                            className="font-bold text-base mb-0.5"
                                            style={{ color: colors.info }}
                                        >
                                            Request to Join
                                        </Text>

                                        <Text className="text-text text-opacity-70 text-sm">
                                            Approval required from the host.
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                    {/* pending request */}
                    {!isMember && data?.requestedToJoin && (
                        <View
                            className="rounded-2xl p-4"
                            style={{
                                backgroundColor: `${colors.warn}15`,
                                borderWidth: 1,
                                borderColor: `${colors.warn}30`
                            }}
                        >
                            <View className="flex-row items-center gap-3">
                                <View
                                    className="rounded-full p-2.5"
                                    style={{
                                        backgroundColor: `${colors.warn}25`
                                    }}
                                >
                                    <Clock size={20} color={colors.warn} />
                                </View>

                                <View className="flex-1">
                                    <Text
                                        className="font-bold text-base mb-0.5"
                                        style={{ color: colors.warn }}
                                    >
                                        Request Pending
                                    </Text>

                                    <Text className="text-text text-opacity-70 text-sm">
                                        Waiting for approval from the host.
                                    </Text>
                                </View>
                            </View>
                        </View>
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
                            leftIcon={<Archive size={18} color={colors.text} />}
                            onPress={() => leaveMutation.mutate()}
                            loading={leaveMutation.isPending}
                        >
                            {isProject ? "Leave Project" : "Leave Burrow"}
                        </Button>
                    ) : !isMember && data?.requestedToJoin ? (
                        <Button
                            variant="outline"
                            size="lg"
                            fullWidth
                            leftIcon={<X size={18} color={colors.error} />}
                            onPress={() => cancelRequestMutation.mutate()}
                            loading={cancelRequestMutation.isPending}
                        >
                            <Text style={{ color: colors.error }}>
                                Cancel Request
                            </Text>
                        </Button>
                    ) : !isMember ? (
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            leftIcon={<Users size={18} color="#FFFFFF" />}
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
                        burrowKind={data.burrow.kind}
                        mode="update"
                        burrowID={id}
                        initialData={getInitialFormData()}
                    />
                )}
            </Modal>

            {/* Burrow Features Modal */}
            <Modal
                visible={featuresModalOpen}
                onClose={() => setFeaturesModalOpen(false)}
                size="full"
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
                title="Invite User"
            >
                {id && (
                    <InviteUserModal
                        burrowID={id}
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

            <Modal
                visible={showMenu}
                onClose={() => setShowMenu(false)}
                scrollable={false}
            >
                <View className="pb-2">
                    <Pressable
                        onPress={() => {
                            setShowMenu(false)
                            setTimeout(() => setShowReportUserModal(true), 300)
                        }}
                        className="flex-row items-center gap-4 py-4 active:opacity-70"
                    >
                        <ThemedIcon
                            icon={CircleAlert}
                            size={22}
                            overrideColor="warn"
                        />

                        <Text className="text-text text-base">Report Host</Text>
                    </Pressable>

                    <View className="h-px bg-card-border" />

                    <Pressable
                        onPress={() => {
                            setShowMenu(false)
                            setTimeout(
                                () => setShowReportBurrowModal(true),
                                300
                            )
                        }}
                        className="flex-row items-center gap-4 py-4 active:opacity-70"
                    >
                        <ThemedIcon
                            icon={Flag}
                            size={22}
                            overrideColor="warn"
                        />
                        <Text className="text-text text-base">
                            Report Burrow
                        </Text>
                    </Pressable>

                    <View className="h-px bg-card-border" />

                    <Pressable
                        onPress={() => {
                            setShowMenu(false)
                            setTimeout(() => setShowBlockModal(true), 300)
                        }}
                        className="flex-row items-center gap-4 py-4 active:opacity-70"
                    >
                        <ThemedIcon
                            icon={ShieldBan}
                            size={22}
                            overrideColor="error"
                        />
                        <Text className="text-text text-base">
                            Block Author
                        </Text>
                    </Pressable>

                    <View className="h-px bg-card-border mt-2" />

                    <Pressable
                        onPress={() => setShowMenu(false)}
                        className="py-4 active:opacity-70"
                    >
                        <Text className="text-text text-base text-center font-semibold">
                            Cancel
                        </Text>
                    </Pressable>
                </View>
            </Modal>

            {/* Block Author Modal */}
            <BlockUserModal
                visible={showBlockModal}
                onClose={() => setShowBlockModal(false)}
                userID={burrow.ownerID}
                displayName={
                    data.burrowAuthorProfile?.name ||
                    data.burrowAuthor ||
                    "User"
                }
            />

            {/* Report Author Modal */}
            <ReportUserModal
                visible={showReportUserModal}
                onClose={() => setShowReportUserModal(false)}
                userID={burrow.ownerID}
                displayName={
                    data.burrowAuthorProfile?.name ||
                    data.burrowAuthor ||
                    "User"
                }
            />

            {/* Report Burrow Modal */}
            <ReportBurrowModal
                visible={showReportBurrowModal}
                onClose={() => setShowReportBurrowModal(false)}
                burrowID={burrow.id}
                burrowTitle={burrow.title}
            />
        </SafeAreaView>
    )
}
