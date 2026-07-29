import { View, Pressable, Alert } from "react-native"
import { Text } from "@components/core"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
    ArrowUp,
    ArrowDown,
    UserX,
    User as UserIcon
} from "lucide-react-native"
import ThemedIcon from "@components/core/ThemedIcon"
import { changeRole, toggleBanMember } from "@features/burrows/burrows.api"
import type {
    BurrowMembershipResponse,
    BurrowRole
} from "@features/burrows/burrows.types"
import { useThemeColors } from "@api/theme/useThemeColors"
import Toast from "react-native-toast-message"
import { useRouter } from "expo-router"

/**
 * {@link AttendeeActionsModal}
 */
type AttendeeActionsModalProps = {
    burrowID: string
    attendee: BurrowMembershipResponse
    currentUserRole: BurrowRole
    onClose: () => void
}

/**
 * Modal to manage a member of a Burrow.
 *
 * Shows actions: Promote, Demote, Remove, View Profile.
 *
 * @param burrowID The ID of the Burrow to manage an attendee in.
 * @param attendee The attendee to manage.
 * @param currentUserRole The role of the managing user.
 * @param onClose Close the modal.
 *
 * @author AJ Kneisl
 */
export function AttendeeActionsModal({
    burrowID,
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
    const canRemove =
        isHost || (currentUserRole === "MODERATOR" && attendeeRole === "MEMBER")

    // Change role mutation
    const changeRoleMutation = useMutation({
        mutationFn: ({ newRole }: { newRole: BurrowRole }) =>
            changeRole(burrowID, attendee.user.id, newRole),

        onSuccess: async (_, { newRole }) => {
            // refresh after change
            await queryClient.invalidateQueries({
                queryKey: ["attendees", burrowID]
            })
            await queryClient.invalidateQueries({
                queryKey: ["burrow", burrowID]
            })

            const roleLabel = newRole === "MODERATOR" ? "Moderator" : "Member"

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
        mutationFn: () => toggleBanMember(burrowID, attendee.user.id),
        onSuccess: async () => {
            // refresh after change
            await queryClient.invalidateQueries({
                queryKey: ["attendees", burrowID]
            })
            await queryClient.invalidateQueries({
                queryKey: ["burrow", burrowID]
            })

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

    // promote the user
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

    // demote the user
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

    // remove the user
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

    // view the profile
    const handleViewProfile = () => {
        onClose()

        router.push(`/user/${attendee.user.username}`)
    }

    return (
        <View>
            <View className="space-y-2 gap-2">
                {/* view profile */}
                <Pressable
                    onPress={handleViewProfile}
                    className="flex-row items-center p-4 bg-card rounded-lg active:bg-card-border"
                >
                    <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: `${colors.info}1A` }}
                    >
                        <ThemedIcon
                            icon={UserIcon}
                            size={20}
                            overrideColor="info"
                        />
                    </View>

                    <View className="flex-1">
                        <Text className="text-text font-semibold">
                            View Profile
                        </Text>

                        <Text className="text-text text-opacity-60 text-xs">
                            See {attendee.user.username}&apos;s profile
                        </Text>
                    </View>
                </Pressable>

                {/* promote user */}
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
                            <ThemedIcon
                                icon={ArrowUp}
                                size={20}
                                overrideColor="success"
                            />
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

                {/* demote user */}
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
                            <ThemedIcon
                                icon={ArrowDown}
                                size={20}
                                overrideColor="warn"
                            />
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

                {/* remove from burrow */}
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
                            <ThemedIcon
                                icon={UserX}
                                size={20}
                                overrideColor="error"
                            />
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
        </View>
    )
}
