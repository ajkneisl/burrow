import { acceptJoinRequest, cancelInvite, denyJoinRequest, formatDateTime, getInvites, getJoinRequests } from "@umnburrow/core/api"
import type { InviteWithUsers, JoinRequestWithUser } from "@umnburrow/core/api"
import { View, Pressable, FlatList } from "react-native"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { X, Check, XCircle, Mail, UserPlus, Clock } from "lucide-react-native"
import { Button, Card, Text } from "@components/core"

import { useThemeColors } from "@api/theme/useThemeColors"

import Toast from "react-native-toast-message"

type ManageInvitesModalProps = {
    burrowId: string
    onClose: () => void
}

type TabType = "invites" | "requests"

/**
 * Modal for managing pending invites and join requests.
 * Host/moderator only.
 */
export function ManageInvitesModal({
    burrowId,
    onClose
}: ManageInvitesModalProps) {
    const colors = useThemeColors()
    const queryClient = useQueryClient()

    const [activeTab, setActiveTab] = useState<TabType>("invites")

    // Fetch invites
    const {
        data: invites,
        isLoading: invitesLoading,
        refetch: refetchInvites
    } = useQuery({
        queryKey: ["invites", burrowId],
        queryFn: () => getInvites(burrowId)
    })

    // Fetch join requests
    const {
        data: requests,
        isLoading: requestsLoading,
        refetch: refetchRequests
    } = useQuery({
        queryKey: ["joinRequests", burrowId],
        queryFn: () => getJoinRequests(burrowId)
    })

    // Cancel invite mutation
    const cancelInviteMutation = useMutation({
        mutationFn: ({ inviteeId }: { inviteeId: string }) =>
            cancelInvite(burrowId, inviteeId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invites", burrowId] })
            Toast.show({
                type: "success",
                text1: "Invite cancelled"
            })
        },
        onError: () => {
            Toast.show({
                type: "error",
                text1: "Failed to cancel invite"
            })
        }
    })

    // Accept join request mutation
    const acceptRequestMutation = useMutation({
        mutationFn: ({ requesterId }: { requesterId: string }) =>
            acceptJoinRequest(burrowId, requesterId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["joinRequests", burrowId]
            })
            queryClient.invalidateQueries({ queryKey: ["attendees", burrowId] })
            Toast.show({
                type: "success",
                text1: "Request accepted",
                text2: "User has been added to the burrow"
            })
        },
        onError: () => {
            Toast.show({
                type: "error",
                text1: "Failed to accept request"
            })
        }
    })

    // Deny join request mutation
    const denyRequestMutation = useMutation({
        mutationFn: ({ requesterId }: { requesterId: string }) =>
            denyJoinRequest(burrowId, requesterId),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["joinRequests", burrowId]
            })
            Toast.show({
                type: "success",
                text1: "Request denied"
            })
        },
        onError: () => {
            Toast.show({
                type: "error",
                text1: "Failed to deny request"
            })
        }
    })

    // Render invite item
    const renderInvite = ({ item }: { item: InviteWithUsers }) => (
        <Card variant="bordered" className="mb-3">
            <View className="space-y-3 gap-3">
                <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                            <Mail size={16} color={colors.primary} />
                            <Text className="text-text font-semibold">
                                @{item.inviteeUsername}
                            </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                            <Clock
                                size={12}
                                color={colors.text}
                                style={{ opacity: 0.6 }}
                            />
                            <Text className="text-text text-opacity-60 text-xs">
                                Sent {formatDateTime(item.invite.createdAt)}
                            </Text>
                        </View>
                    </View>

                    <View
                        className={`px-2 py-1 rounded ${
                            item.invite.status === "PENDING"
                                ? "bg-warn/10"
                                : "bg-success/10"
                        }`}
                    >
                        <Text
                            className={`text-xs font-semibold ${
                                item.invite.status === "PENDING"
                                    ? "text-warn"
                                    : "text-success"
                            }`}
                        >
                            {item.invite.status}
                        </Text>
                    </View>
                </View>

                {item.invite.status === "PENDING" && (
                    <Button
                        variant="outline"
                        size="sm"
                        onPress={() =>
                            cancelInviteMutation.mutate({
                                inviteeId: item.invite.inviteeID
                            })
                        }
                        loading={cancelInviteMutation.isPending}
                        leftIcon={<XCircle size={16} color={colors.error} />}
                    >
                        Cancel Invite
                    </Button>
                )}
            </View>
        </Card>
    )

    // Render join request item
    const renderRequest = ({ item }: { item: JoinRequestWithUser }) => (
        <Card variant="bordered" className="mb-3">
            <View className="space-y-3 gap-3">
                <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                        <View className="flex-row items-center gap-2 mb-1">
                            <UserPlus size={16} color={colors.info} />
                            <Text className="text-text font-semibold">
                                @{item.requester}
                            </Text>
                        </View>
                        <View className="flex-row items-center gap-2">
                            <Clock
                                size={12}
                                color={colors.text}
                                style={{ opacity: 0.6 }}
                            />
                            <Text className="text-text text-opacity-60 text-xs">
                                Requested{" "}
                                {formatDateTime(item.request.createdAt)}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="flex-row gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onPress={() =>
                            denyRequestMutation.mutate({
                                requesterId: item.request.requesterID
                            })
                        }
                        loading={denyRequestMutation.isPending}
                        leftIcon={<X size={16} color={colors.error} />}
                        className="flex-1"
                    >
                        Deny
                    </Button>
                    <Button
                        variant="success"
                        size="sm"
                        onPress={() =>
                            acceptRequestMutation.mutate({
                                requesterId: item.request.requesterID
                            })
                        }
                        loading={acceptRequestMutation.isPending}
                        leftIcon={<Check size={16} color="#FFFFFF" />}
                        className="flex-1"
                    >
                        Accept
                    </Button>
                </View>
            </View>
        </Card>
    )

    const invitesList = invites?.contents ?? []
    const requestsList = requests?.contents ?? []

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="px-6 py-4 border-b border-card-border">
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-xl font-bold text-text">
                        Manage Invites
                    </Text>
                    <Pressable onPress={onClose}>
                        <X size={24} color={colors.text} />
                    </Pressable>
                </View>

                {/* Tabs */}
                <View className="flex-row gap-2">
                    <Pressable
                        onPress={() => setActiveTab("invites")}
                        className={`flex-1 py-3 rounded-lg ${
                            activeTab === "invites" ? "bg-primary" : "bg-card"
                        }`}
                    >
                        <Text
                            className={`text-center font-semibold ${
                                activeTab === "invites"
                                    ? "text-white"
                                    : "text-text"
                            }`}
                        >
                            Pending Invites ({invitesList.length})
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => setActiveTab("requests")}
                        className={`flex-1 py-3 rounded-lg ${
                            activeTab === "requests" ? "bg-primary" : "bg-card"
                        }`}
                    >
                        <Text
                            className={`text-center font-semibold ${
                                activeTab === "requests"
                                    ? "text-white"
                                    : "text-text"
                            }`}
                        >
                            Join Requests ({requestsList.length})
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Content */}
            <View className="flex-1">
                {activeTab === "invites" ? (
                    <FlatList
                        data={invitesList}
                        keyExtractor={(item) => item.invite.inviteeID}
                        renderItem={renderInvite}
                        contentContainerStyle={
                            invitesList.length
                                ? { padding: 24 }
                                : { flex: 1, justifyContent: "center" }
                        }
                        ListEmptyComponent={
                            <View className="items-center">
                                <Mail
                                    size={48}
                                    color={colors.text}
                                    style={{ opacity: 0.2 }}
                                />
                                <Text className="text-text text-opacity-60 mt-4">
                                    No pending invites
                                </Text>
                            </View>
                        }
                        refreshing={invitesLoading}
                        onRefresh={refetchInvites}
                    />
                ) : (
                    <FlatList
                        data={requestsList}
                        keyExtractor={(item) => item.request.requesterID}
                        renderItem={renderRequest}
                        contentContainerStyle={
                            requestsList.length
                                ? { padding: 24 }
                                : { flex: 1, justifyContent: "center" }
                        }
                        ListEmptyComponent={
                            <View className="items-center">
                                <UserPlus
                                    size={48}
                                    color={colors.text}
                                    style={{ opacity: 0.2 }}
                                />
                                <Text className="text-text text-opacity-60 mt-4">
                                    No join requests
                                </Text>
                            </View>
                        }
                        refreshing={requestsLoading}
                        onRefresh={refetchRequests}
                    />
                )}
            </View>
        </View>
    )
}
