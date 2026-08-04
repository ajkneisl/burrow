import { blockUser } from "@umnburrow/core/api"
import { View } from "react-native"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { Modal, Button, Text } from "@components/core"

/**
 * {@link BlockUserModal}
 */
type BlockUserModalProps = {
    visible: boolean
    onClose: () => void
    userID: string
    displayName: string
}

/**
 * The modal to block a user.
 *
 * @param visible If the modal is visible.
 * @param onClose When the modal is closed.
 * @param userID The ID to block.
 * @param displayName The display name of the user to block.
 */
export function BlockUserModal({
    visible,
    onClose,
    userID,
    displayName
}: BlockUserModalProps) {
    const queryClient = useQueryClient()

    const blockMutation = useMutation({
        mutationFn: () => blockUser(userID),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["user"] })
            await queryClient.invalidateQueries({ queryKey: ["blockedUsers"] })

            Toast.show({
                type: "success",
                text1: "User blocked",
                text2: `You have blocked ${displayName}`
            })
            
            onClose()
        },
        onError: (error: any) => {
            console.log(error)
            Toast.show({
                type: "error",
                text1: "Failed to block user",
                text2: error.message || "Please try again"
            })
        }
    })

    return (
        <Modal
            visible={visible}
            onClose={onClose}
            title="Block User"
            centered
            scrollable={false}
        >
            <Text className="text-text mb-4">
                Are you sure you want to block{" "}
                <Text className="font-bold">{displayName}</Text>?
            </Text>

            <Text className="text-text text-opacity-70 mb-6">
                They will not be able to find your profile, see your Burrows, or
                contact you.
            </Text>

            <View className="flex-row gap-3">
                <Button
                    variant="outline"
                    onPress={onClose}
                    className="flex-1"
                    disabled={blockMutation.isPending}
                >
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    onPress={() => blockMutation.mutate()}
                    loading={blockMutation.isPending}
                    className="flex-1"
                >
                    Block
                </Button>
            </View>
        </Modal>
    )
}
