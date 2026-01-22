import { View, Text } from "react-native"
import { useMutation } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { Modal, Button } from "@components/core"
import { deleteAccount } from "@features/auth/user.api"

/**
 * {@link DeleteAccountModal}
 */
type DeleteAccountModalProps = {
    visible: boolean
    onClose: () => void
    onDeleted: () => void
}

/**
 * Modal to delete account.
 *
 * @param visible If the modal is visible.
 * @param onClose When the modal is closed.
 * @param onDeleted When the account is deleted.
 *
 * @author AJ Kneisl
 */
export function DeleteAccountModal({
    visible,
    onClose,
    onDeleted
}: DeleteAccountModalProps) {
    const deleteMutation = useMutation({
        mutationFn: deleteAccount,

        onSuccess: () => {
            Toast.show({
                type: "success",
                text1: "Account deleted",
                text2: "Your account has been permanently deleted"
            })
            onDeleted()
        },

        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Failed to delete account",
                text2: error.message || "Please try again"
            })
        }
    })

    return (
        <Modal
            visible={visible}
            onClose={onClose}
            title="Delete Account"
            centered
            scrollable={false}
        >
            <Text className="text-text mb-4">
                Are you sure you want to delete your account?
            </Text>

            <Text className="text-text text-opacity-70 mb-6">
                This action is permanent and cannot be undone. All your data,
                including your profile, Burrows, and messages will be
                permanently deleted.
            </Text>

            <View className="flex-row gap-3">
                <Button
                    variant="outline"
                    onPress={onClose}
                    className="flex-1"
                    disabled={deleteMutation.isPending}
                >
                    Cancel
                </Button>

                <Button
                    variant="danger"
                    onPress={() => deleteMutation.mutate()}
                    loading={deleteMutation.isPending}
                    className="flex-1"
                >
                    Delete
                </Button>
            </View>
        </Modal>
    )
}
