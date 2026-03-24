import { View, FlatList, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, X, Mail, Clock, Calendar } from "lucide-react-native"
import { Header } from "@features/layout/components"
import { Button, Card, Text } from "@components/core"
import {
    getReceivedInvites,
    acceptInvite,
    declineInvite
} from "@features/burrows/attendees/attendees.api"
import type { InviteWithUsers } from "@features/burrows/burrows.types"
import { useThemeColors } from "@api/theme/useThemeColors"
import { formatDateTime } from "@api/util"
import Toast from "react-native-toast-message"

/**
 * Screen showing all invites received by the current user.
 */
export default function ReceivedInvitesScreen() {
    const router = useRouter()
    const colors = useThemeColors()
    const queryClient = useQueryClient()

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["invites", "received"],
        queryFn: () => getReceivedInvites("PENDING")
    })

    const acceptMutation = useMutation({
        mutationFn: acceptInvite,
        onSuccess: (_, burrowId) => {
            queryClient.invalidateQueries({ queryKey: ["invites", "received"] })
            queryClient.invalidateQueries({ queryKey: ["burrows"] })
            queryClient.invalidateQueries({ queryKey: ["schedule"] })

            Toast.show({
                type: "success",
                text1: "Invite accepted!",
                text2: "You've joined the burrow"
            })

            // Navigate to burrow
            router.push(`/burrow/${burrowId}`)
        },
        onError: () => {
            Toast.show({
                type: "error",
                text1: "Failed to accept invite"
            })
        }
    })

    const declineMutation = useMutation({
        mutationFn: declineInvite,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["invites", "received"] })

            Toast.show({
                type: "success",
                text1: "Invite declined"
            })
        },
        onError: () => {
            Toast.show({
                type: "error",
                text1: "Failed to decline invite"
            })
        }
    })

    const renderInvite = ({ item }: { item: InviteWithUsers }) => {
        const isExpired = item.invite.expiresAt
            ? Date.now() > item.invite.expiresAt
            : false

        return (
            <Card variant="bordered" className="mb-3">
                <View className="space-y-3 gap-3">
                    {/* Header */}
                    <View className="flex-row items-start justify-between">
                        <View className="flex-1">
                            <View className="flex-row items-center gap-2 mb-1">
                                <Mail size={16} color={colors.primary} />
                                <Text className="text-text font-semibold">
                                    Burrow Invitation
                                </Text>
                            </View>
                            <Text className="text-text text-opacity-60 text-sm">
                                From{" "}
                                <Text className="font-semibold">
                                    @{item.inviterUsername}
                                </Text>
                            </Text>
                        </View>

                        {isExpired && (
                            <View className="bg-error/10 px-2 py-1 rounded">
                                <Text className="text-error text-xs font-semibold">
                                    Expired
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Timestamps */}
                    <View className="space-y-1 gap-1">
                        <View className="flex-row items-center gap-2">
                            <Clock size={14} color={colors.text} style={{ opacity: 0.6 }} />
                            <Text className="text-text text-opacity-60 text-xs">
                                Received {formatDateTime(item.invite.createdAt)}
                            </Text>
                        </View>

                        {item.invite.expiresAt && (
                            <View className="flex-row items-center gap-2">
                                <Calendar size={14} color={colors.text} style={{ opacity: 0.6 }} />
                                <Text
                                    className={`text-xs ${
                                        isExpired
                                            ? "text-error"
                                            : "text-text text-opacity-60"
                                    }`}
                                >
                                    {isExpired ? "Expired" : "Expires"}{" "}
                                    {formatDateTime(item.invite.expiresAt)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Actions */}
                    {!isExpired && (
                        <View className="flex-row gap-2 pt-2 border-t border-card-border">
                            <Button
                                variant="outline"
                                size="sm"
                                onPress={() =>
                                    declineMutation.mutate(item.invite.burrowID)
                                }
                                loading={declineMutation.isPending}
                                leftIcon={<X size={16} color={colors.error} />}
                                className="flex-1"
                            >
                                Decline
                            </Button>
                            <Button
                                variant="success"
                                size="sm"
                                onPress={() =>
                                    acceptMutation.mutate(item.invite.burrowID)
                                }
                                loading={acceptMutation.isPending}
                                leftIcon={<Check size={16} color="#FFFFFF" />}
                                className="flex-1"
                            >
                                Accept
                            </Button>
                        </View>
                    )}
                </View>
            </Card>
        )
    }

    const renderEmpty = () => (
        <View className="items-center justify-center py-12">
            <Mail size={48} color={colors.text} style={{ opacity: 0.2 }} />
            <Text className="text-text text-opacity-60 text-lg mt-4">
                No pending invites
            </Text>
            <Text className="text-text text-opacity-40 text-sm mt-1">
                You're all caught up!
            </Text>
        </View>
    )

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Header title="My Invites" />

            <FlatList
                data={data ?? []}
                keyExtractor={(item) => item.invite.burrowID + item.invite.inviteeID}
                renderItem={renderInvite}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={
                    data?.length ? { padding: 24 } : { flex: 1 }
                }
                refreshing={isLoading}
                onRefresh={refetch}
            />
        </SafeAreaView>
    )
}
