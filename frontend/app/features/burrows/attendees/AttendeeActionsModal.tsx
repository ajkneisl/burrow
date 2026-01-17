import { View, Text, Pressable, Alert } from "react-native"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
    X,
    ArrowUp,
    ArrowDown,
    UserX,
    User as UserIcon
} from "lucide-react-native"
import { Button } from "@components/core"
import { changeRole, toggleBanMember } from "@features/burrows/burrows.api"
import type {
    BurrowMembershipResponse,
    BurrowRole
} from "@features/burrows/burrows.types"
import { useThemeColors } from "@api/theme/useThemeColors"
import Toast from "react-native-toast-message"
import { useRouter } from "expo-router"

type AttendeeActionsModalProps = {
    burrowId: string
    attendee: BurrowMembershipResponse
    currentUserRole: BurrowRole
    onClose: () => void
}

/**
 * Bottom sheet modal for managing an attendee.
 * Shows actions: Promote, Demote, Remove, View Profile.
 */
export function AttendeeActionsModal({
    burrowId,
    attendee,
    currentUserRole,
    onClose
}: AttendeeActionsModalProps) {
    const colors = useThemeColors()
    const queryClient = useQueryClient()
    const router = useRouter()

    const isHost = currentUserRole === "HOST"
    const attendeeRole = attendee.membership.role
    const canPromote = isHost && attendeeRole === "MEMBER"
    const canDemote = isHost && attendeeRole === "MODERATOR"
    const canRemove = isHost || (currentUserRole === "MODERATOR" && attendeeRole === "MEMBER")

    // Change role mutation
    const changeRoleMutation = useMutation({
        mutationFn: ({ newRole }: { newRole: BurrowRole }) =>
            changeRole(burrowId, attendee.user.id, newRole),
        onSuccess: (_, { newRole }) => {
            queryClient.invalidateQueries({ queryKey: ["attendees", burrowId] })
            queryClient.invalidateQueries({ queryKey: ["burrow", burrowId] })

            const roleLabel =
                newRole === "MODERATOR" ? "Moderator" : "Member"
            Toast.show({
                type: "success",
                text1: "Role updated",
                text2: `${attendee.user.username} is now a ${roleLabel}`
            })
            onClose()
        },
        onError: () => {
            Toast.show({
                type: "error",
                text1: "Failed to update role"
            })
        }
    })

    // Remove member mutation
    const removeMutation = useMutation({
        mutationFn: () => toggleBanMember(burrowId, attendee.user.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["attendees", burrowId] })
            queryClient.invalidateQueries({ queryKey: ["burrow", burrowId] })

            Toast.show({
                type: "success",
                text1: "Member removed",
                text2: `${attendee.user.username} has been removed`
            })
            onClose()
        },
        onError: () => {
            Toast.show({
                type: "error",
                text1: "Failed to remove member"
            })
        }
    })

    const handlePromote = () => {
        Alert.alert(
            "Promote to Moderator",
            `Are you sure you want to promote ${attendee.user.username} to Moderator? They will be able to manage members and burrow features.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Promote",
                    style: "default",
                    onPress: () =>
                        changeRoleMutation.mutate({ newRole: "MODERATOR" })
                }
            ]
        )
    }

    const handleDemote = () => {
        Alert.alert(
            "Demote to Member",
            `Are you sure you want to demote ${attendee.user.username} to Member? They will lose moderator privileges.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Demote",
                    style: "destructive",
                    onPress: () =>
                        changeRoleMutation.mutate({ newRole: "MEMBER" })
                }
            ]
        )
    }

    const handleRemove = () => {
        Alert.alert(
            "Remove Member",
            `Are you sure you want to remove ${attendee.user.username} from this burrow? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => removeMutation.mutate()
                }
            ]
        )
    }

    const handleViewProfile = () => {
        onClose()
        router.push(`/user/${attendee.user.username}`)
    }

    return (
        <View className="bg-background rounded-t-3xl">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-card-border">
                <View>
                    <Text className="text-xl font-bold text-text">
                        Manage Member
                    </Text>
                    <Text className="text-text text-opacity-60 text-sm mt-1">
                        @{attendee.user.username}
                    </Text>
                </View>
                <Pressable onPress={onClose}>
                    <X size={24} color={colors.text} />
                </Pressable>
            </View>

            {/* Actions */}
            <View className="px-6 py-4 space-y-2 gap-2">
                {/* View Profile */}
                <Pressable
                    onPress={handleViewProfile}
                    className="flex-row items-center p-4 bg-card rounded-lg active:bg-card-border"
                >
                    <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: `${colors.info}1A` }}
                    >
                        <UserIcon size={20} color={colors.info} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-text font-semibold">
                            View Profile
                        </Text>
                        <Text className="text-text text-opacity-60 text-xs">
                            See {attendee.user.username}'s profile
                        </Text>
                    </View>
                </Pressable>

                {/* Promote to Moderator */}
                {canPromote && (
                    <Pressable
                        onPress={handlePromote}
                        disabled={changeRoleMutation.isPending}
                        className="flex-row items-center p-4 bg-card rounded-lg active:bg-card-border"
                    >
                        <View
                            className="w-10 h-10 rounded-full items-center justify-center mr-3"
                            style={{ backgroundColor: `${colors.success}1A` }}
                        >
                            <ArrowUp size={20} color={colors.success} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-text font-semibold">
                                Promote to Moderator
                            </Text>
                            <Text className="text-text text-opacity-60 text-xs">
                                Grant moderator privileges
                            </Text>
                        </View>
                    </Pressable>
                )}

                {/* Demote to Member */}
                {canDemote && (
                    <Pressable
                        onPress={handleDemote}
                        disabled={changeRoleMutation.isPending}
                        className="flex-row items-center p-4 bg-card rounded-lg active:bg-card-border"
                    >
                        <View
                            className="w-10 h-10 rounded-full items-center justify-center mr-3"
                            style={{ backgroundColor: `${colors.warn}1A` }}
                        >
                            <ArrowDown size={20} color={colors.warn} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-text font-semibold">
                                Demote to Member
                            </Text>
                            <Text className="text-text text-opacity-60 text-xs">
                                Remove moderator privileges
                            </Text>
                        </View>
                    </Pressable>
                )}

                {/* Remove from Burrow */}
                {canRemove && (
                    <Pressable
                        onPress={handleRemove}
                        disabled={removeMutation.isPending}
                        className="flex-row items-center p-4 bg-card rounded-lg active:bg-card-border"
                    >
                        <View
                            className="w-10 h-10 rounded-full items-center justify-center mr-3"
                            style={{ backgroundColor: `${colors.error}1A` }}
                        >
                            <UserX size={20} color={colors.error} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-error font-semibold">
                                Remove from Burrow
                            </Text>
                            <Text className="text-text text-opacity-60 text-xs">
                                Remove this member permanently
                            </Text>
                        </View>
                    </Pressable>
                )}
            </View>

            {/* Footer */}
            <View className="px-6 pb-6">
                <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    onPress={onClose}
                >
                    Cancel
                </Button>
            </View>
        </View>
    )
}
