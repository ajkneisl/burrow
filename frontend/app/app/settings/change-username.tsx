import { useState } from "react"
import { View } from "react-native"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { Input, Button, Text, Modal } from "@components/core"
import useUser from "@features/auth/hooks/useUser"
import { updateUsername } from "@features/auth/user.api"

type ChangeUsernameModalProps = {
    visible: boolean
    onClose: () => void
}

/**
 * Change username modal.
 *
 * @author AJ Kneisl
 */
export default function ChangeUsernameModal({
    visible,
    onClose
}: ChangeUsernameModalProps) {
    const user = useUser()
    const queryClient = useQueryClient()

    const [username, setUsername] = useState(user?.username ?? "")
    const [error, setError] = useState<string | undefined>()

    const mutation = useMutation({
        mutationFn: async () => {
            const trimmed = username.trim()

            if (!trimmed) {
                setError("Username cannot be empty")
                throw new Error("Validation failed")
            }

            return await updateUsername(trimmed)
        },

        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["user"] })

            Toast.show({
                type: "success",
                text1: "Username updated",
                text2: "Your username has been changed successfully"
            })

            onClose()
        },

        onError: (err: any) => {
            if (err.message !== "Validation failed") {
                setError(
                    typeof err === "string"
                        ? err
                        : err.message || "Please try again"
                )
            }
        }
    })

    return (
        <Modal
            visible={visible}
            onClose={onClose}
            title="Change Username"
            scrollable={false}
        >
            <View className="gap-6">
                <Text className="text-text opacity-50 text-sm">
                    Your username is how others find you on Burrow.
                </Text>

                <Input
                    label="Username"
                    value={username}
                    onChangeText={(value) => {
                        setUsername(value)
                        if (error) setError(undefined)
                    }}
                    placeholder="Enter your username"
                    error={error}
                    autoCapitalize="none"
                    autoCorrect={false}
                />

                <View className="flex-row gap-3">
                    <Button
                        variant="outline"
                        onPress={onClose}
                        className="flex-1"
                        disabled={mutation.isPending}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="primary"
                        onPress={() => {
                            setError(undefined)
                            mutation.mutate()
                        }}
                        className="flex-1"
                        loading={mutation.isPending}
                    >
                        Save
                    </Button>
                </View>
            </View>
        </Modal>
    )
}
