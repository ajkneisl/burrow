import { View, Text, Pressable, ScrollView } from "react-native"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { X, Send } from "lucide-react-native"
import { Button } from "@components/core"
import { UserPicker } from "@components/core/UserPicker"
import { createInvite } from "@features/burrows/attendees/attendees.api"
import { useThemeColors } from "@api/theme/useThemeColors"
import Toast from "react-native-toast-message"

type InviteUserModalProps = {
    burrowId: string
    onClose: () => void
}

/**
 * Modal for inviting a user to a burrow.
 * Host/moderator only.
 */
export function InviteUserModal({ burrowId, onClose }: InviteUserModalProps) {
    const colors = useThemeColors()
    const queryClient = useQueryClient()

    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

    const inviteMutation = useMutation({
        mutationFn: async () => {
            if (!selectedUserId) return

            await createInvite(burrowId, selectedUserId, undefined)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["invites", burrowId]
            })
            Toast.show({
                type: "success",
                text1: "Invite sent!",
                text2: "The user will be notified"
            })
            onClose()
        },
        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Failed to send invite",
                text2: error.message || "Please try again"
            })
        }
    })

    const handleInvite = () => {
        if (!selectedUserId) {
            Toast.show({
                type: "error",
                text1: "No user selected",
                text2: "Please select a user to invite"
            })
            return
        }

        inviteMutation.mutate()
    }

    return (
        <View className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-card-border">
                <Text className="text-xl font-bold text-text">Invite User</Text>
                <Pressable onPress={onClose}>
                    <X size={24} color={colors.text} />
                </Pressable>
            </View>

            {/* Content */}
            <ScrollView className="flex-1 px-6 py-4" nestedScrollEnabled={true}>
                <Text className="text-text text-opacity-60 text-sm mb-4">
                    Search for a user and send them an invitation to join this
                    burrow.
                </Text>

                {/* User Picker */}
                <UserPicker
                    mode="multiple"
                    maxSelection={1}
                    selectedUserIds={selectedUserId ? [selectedUserId] : []}
                    onUserToggle={(userId) => {
                        setSelectedUserId(selectedUserId === userId ? null : userId)
                    }}
                    label="Select User"
                />

                {/* Info Box */}
                <View className="bg-info/10 p-4 rounded-lg mb-4">
                    <Text className="text-text text-opacity-80 text-xs">
                        <Text className="font-semibold">Note:</Text> The invited
                        user will receive a notification and can accept or
                        decline the invitation.
                    </Text>
                </View>
            </ScrollView>

            {/* Footer Actions */}
            <View className="px-6 py-4 border-t border-card-border">
                <View className="flex-row gap-3">
                    <Button
                        variant="outline"
                        size="lg"
                        onPress={onClose}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="lg"
                        onPress={handleInvite}
                        disabled={!selectedUserId}
                        loading={inviteMutation.isPending}
                        leftIcon={<Send size={20} color="#FFFFFF" />}
                        className="flex-1"
                    >
                        Send Invite
                    </Button>
                </View>
            </View>
        </View>
    )
}
