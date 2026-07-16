import { View, Pressable, ActivityIndicator, Alert } from "react-native"
import { useGlassTabOptions } from "@features/layout/components"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter, usePathname, Stack, Tabs } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useCallback } from "react"
import { useAtom } from "jotai"
import {
    Users,
    ChevronLeft,
    Archive,
    GraduationCap,
    EllipsisVertical,
    MessageSquare,
    Info,
    Pencil,
    Settings,
    Trash2,
    UserPlus,
    ListChecks
} from "lucide-react-native"
import { Button, Modal, Text } from "@components/core"
import {
    getBurrow,
    joinBurrow,
    leaveBurrow,
    deleteMeeting
} from "@features/burrows/burrows.api"
import { cancelJoinRequest } from "@features/burrows/attendees/attendees.api"
import useUser from "@features/auth/hooks/useUser"
import Toast from "react-native-toast-message"
import { CreateBurrowWizard } from "@features/burrows/create/CreateBurrowWizard"
import type { SubmittedBurrowFormState } from "@features/burrows/create/create.types"
import { BurrowFeaturesModal } from "@features/sync/components/BurrowFeaturesModal"
import { InviteUserModal } from "@features/invites/InviteUserModal"
import { ManageInvitesModal } from "@features/invites/ManageInvitesModal"
import { blockStatus } from "@features/sync/sync.atom"
import useSync from "@features/sync/hooks/useSync"
import { useThemeColors } from "@api/theme/useThemeColors"
import { ProfilePicture } from "@features/profile/components/ProfilePicture"
import ClubProfilePicture from "@features/clubs/components/ClubProfilePicture"
import Share from "@features/burrows/attendees/Share"
import ThemedIcon from "@components/core/ThemedIcon"
import KindChip from "@features/burrows/components/KindChip"
import NonMemberContent from "@features/burrows/view/NonMemberContent"
import BurrowMenuModal from "@features/burrows/view/BurrowMenuModal"
import {
    BurrowContext,
    BurrowContextType
} from "@features/burrows/context/burrows.context"

export default function BurrowLayout() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const router = useRouter()
    const queryClient = useQueryClient()
    const currentUser = useUser()
    const colors = useThemeColors()
    const tabOptions = useGlassTabOptions()

    const [blocks] = useAtom(blockStatus)
    const pathname = usePathname()
    const insets = useSafeAreaInsets()

    // modals
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [featuresModalOpen, setFeaturesModalOpen] = useState(false)
    const [inviteModalOpen, setInviteModalOpen] = useState(false)
    const [manageInvitesModalOpen, setManageInvitesModalOpen] = useState(false)

    // menu modal
    const [showMenu, setShowMenu] = useState(false)

    const { data, isLoading, isError } = useQuery({
        queryKey: ["burrow", id],
        queryFn: async () => await getBurrow(id!),
        enabled: !!id
    })

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
            <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        )
    }

    if (isError || !data?.burrow) {
        return (
            <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
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

    const isInfoTab = pathname.endsWith(`/${id}`) || pathname.endsWith(`/${id}/`)
    const isMembersTab = pathname.endsWith("/members")

    const handleDelete = () => {
        Alert.alert(
            "Delete Burrow",
            `Are you sure you want to delete "${burrow.title}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => deleteMutation.mutate()
                }
            ]
        )
    }

    const contextValue: BurrowContextType = {
        id: id!,
        data,
        isOwner,
        isMember,
        isHostOrMod,
        isPast,
        isProject,
        blocks,
        leaveMutation,
        deleteMutation,
        setEditModalOpen,
        setFeaturesModalOpen,
        setInviteModalOpen,
        setManageInvitesModalOpen
    }

    return (
        <BurrowContext.Provider value={contextValue}>
            <View className="flex-1 bg-background">
                <Stack.Screen options={{ headerShown: false }} />

                {/* header */}
                <View
                    className="bg-card px-6 pb-4 flex-row items-center justify-between"
                    style={{ paddingTop: insets.top + 16 }}
                >
                    <Pressable
                        onPress={() => router.back()}
                        className="p-2 -ml-2"
                    >
                        <ThemedIcon icon={ChevronLeft} size={28} />
                    </Pressable>

                    <View className="flex-row items-center gap-1">
                        {/* Info tab: Edit, Features, Delete */}
                        {isOwner && !isPast && isInfoTab && (
                            <>
                                <Pressable
                                    onPress={() => setEditModalOpen(true)}
                                    hitSlop={12}
                                    className="p-2"
                                >
                                    <Pencil size={24} color={colors.text} />
                                </Pressable>

                                <Pressable
                                    onPress={() => setFeaturesModalOpen(true)}
                                    hitSlop={12}
                                    className="p-2"
                                >
                                    <Settings size={24} color={colors.text} />
                                </Pressable>

                                <Pressable
                                    onPress={handleDelete}
                                    disabled={deleteMutation.isPending}
                                    hitSlop={12}
                                    className="p-2"
                                >
                                    <Trash2 size={24} color={colors.error} />
                                </Pressable>
                            </>
                        )}

                        {/* Members tab: Invite, Manage Invites */}
                        {isOwner && !isPast && isMembersTab && (
                            <>
                                <Pressable
                                    onPress={() => setInviteModalOpen(true)}
                                    hitSlop={12}
                                    className="p-2"
                                >
                                    <UserPlus size={24} color={colors.text} />
                                </Pressable>

                                <Pressable
                                    onPress={() => setManageInvitesModalOpen(true)}
                                    hitSlop={12}
                                    className="p-2"
                                >
                                    <ListChecks size={24} color={colors.text} />
                                </Pressable>
                            </>
                        )}

                        <Share burrowID={burrow.id} title={burrow.title} />

                        {!isOwner && (
                            <Pressable
                                onPress={() => setShowMenu(true)}
                                className="p-2"
                                hitSlop={12}
                            >
                                <EllipsisVertical
                                    size={24}
                                    color={colors.text}
                                />
                            </Pressable>
                        )}
                    </View>
                </View>

                {/* burrow info */}
                <View className="bg-card px-6 pt-6 pb-4 border-b border-card-border">
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

                    <View className="flex-row items-start justify-between mb-3">
                        <Text className="text-3xl font-bold text-text flex-1 mr-4">
                            {burrow.title}
                        </Text>

                        <KindChip kind={burrow.kind} />
                    </View>

                    <Pressable
                        onPress={() =>
                            data.clubName
                                ? router.push(`/club/${data.clubName}` as any)
                                : router.push(`/user/${data.burrowAuthor}`)
                        }
                        className="flex-row items-center mb-3 gap-2"
                    >
                        {data.clubName ? (
                            <ClubProfilePicture
                                clubID={burrow.clubID!}
                                displayName={
                                    data.clubDisplayName ?? data.clubName
                                }
                                size="md"
                            />
                        ) : (
                            <ProfilePicture
                                userID={data.burrow.ownerID}
                                name={data.burrowAuthorProfile?.name ?? "?"}
                                size={"md"}
                            />
                        )}

                        <View className="flex-1">
                            <Text className="text-sm text-text text-opacity-60">
                                {data.clubName
                                    ? "Club"
                                    : isProject
                                      ? "Created by"
                                      : "Hosted by"}
                            </Text>

                            <View className="flex-row items-center gap-2">
                                <Text className="text-base text-text font-semibold">
                                    {data.clubDisplayName ??
                                        data.burrowAuthorProfile?.name ??
                                        data.burrowAuthor}
                                </Text>

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

                {/* Non-member content (no tabs) */}
                {!isMember ? (
                    <NonMemberContent
                        data={data}
                        burrow={burrow}
                        isProject={isProject}
                        isPast={isPast}
                        joinMutation={joinMutation}
                        cancelRequestMutation={cancelRequestMutation}
                        id={id!}
                    />
                ) : (
                    /* Tab navigator for members */
                    <Tabs screenOptions={tabOptions}>
                        <Tabs.Screen
                            name="index"
                            options={{
                                title: "About",
                                tabBarIcon: ({ color, size }) => (
                                    <Info color={color} size={size} />
                                )
                            }}
                        />

                        <Tabs.Screen
                            name="chat"
                            options={{
                                title: "Chat",
                                tabBarIcon: ({ color, size }) => (
                                    <MessageSquare color={color} size={size} />
                                )
                            }}
                        />

                        <Tabs.Screen
                            name="members"
                            options={{
                                title: "Members",
                                tabBarIcon: ({ color, size }) => (
                                    <Users color={color} size={size} />
                                )
                            }}
                        />
                    </Tabs>
                )}

                {/* Edit Burrow Modal */}
                <Modal
                    visible={editModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    size="full"
                    scrollable={false}
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

                <BurrowMenuModal
                    visible={showMenu}
                    onClose={() => setShowMenu(false)}
                    ownerID={burrow.ownerID}
                    ownerDisplayName={
                        data.burrowAuthorProfile?.name ||
                        data.burrowAuthor ||
                        "User"
                    }
                    burrowID={burrow.id}
                    burrowTitle={burrow.title}
                />
            </View>
        </BurrowContext.Provider>
    )
}
