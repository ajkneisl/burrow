import { View, Text } from "react-native"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { Modal, Button } from "@components/core"
import { blockUser } from "@features/profile/block.api"

type BlockUserModalProps = {
    visible: boolean
    onClose: () => void
    userID: string
    displayName: string
}

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
