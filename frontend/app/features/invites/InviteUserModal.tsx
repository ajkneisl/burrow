import { View, Text, ScrollView } from "react-native"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Send } from "lucide-react-native"
import { Button } from "@components/core"
import { UserPicker } from "@components/core/UserPicker"
import { createInvite } from "@features/burrows/attendees/attendees.api"
import Toast from "react-native-toast-message"

/**
 * {@link InviteUserModal}
 */
type InviteUserModalProps = {
    burrowID: string
    onClose: () => void
}

/**
 * Modal for inviting a user to a Burrow.
 *
 * @param burrowID The Burrow to invite the user in.
 * @param onClose Close the modal.
 *
 * @author AJ Kneisl
 */
export function InviteUserModal({ burrowID, onClose }: InviteUserModalProps) {
    const queryClient = useQueryClient()

    const [selectedUserID, setSelectedUserID] = useState<string | null>(null)

    const inviteMutation = useMutation({
        mutationFn: async () => {
            if (!selectedUserID) return

            await createInvite(burrowID, selectedUserID, undefined)
        },

        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["invites", burrowID]
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
        if (!selectedUserID) {
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
            <ScrollView className="flex-1 px-6 py-4" nestedScrollEnabled={true}>
                <Text className="text-text text-opacity-60 text-sm mb-4">
                    Search for a user and send them an invitation to join this
                    burrow.
                </Text>

                {/* User Picker */}
                <UserPicker
                    mode="multiple"
                    maxSelection={1}
                    selectedUserIds={selectedUserID ? [selectedUserID] : []}
                    onUserToggle={(userId) => {
                        setSelectedUserID(
                            selectedUserID === userId ? null : userId
                        )
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
                        disabled={!selectedUserID}
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
