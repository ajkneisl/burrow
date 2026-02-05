import { useState } from "react"
import { View, Text, Pressable, KeyboardAvoidingView, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { ArrowLeft } from "lucide-react-native"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { Input, Button } from "@components/core"
import useUser from "@features/auth/hooks/useUser"
import { updateUsername } from "@features/auth/user.api"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * Change username settings page.
 *
 * @author AJ Kneisl
 */
export default function ChangeUsernameScreen() {
    const router = useRouter()
    const user = useUser()
    const colors = useThemeColors()
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

            router.back()
        },

        onError: (err: any) => {
            if (err.message !== "Validation failed") {
                Toast.show({
                    type: "error",
                    text1: "Failed to update username",
                    text2: err.message || "Please try again"
                })
            }
        }
    })

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 py-4 border-b border-card-border flex-row items-center">
                <Pressable onPress={() => router.back()} className="p-2 mr-2">
                    <ArrowLeft size={24} color={colors.text} />
                </Pressable>

                <Text className="text-2xl font-bold text-text">Change Username</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 px-6 py-4"
            >
                <Input
                    label="Username"
                    value={username}
                    onChangeText={(value) => {
                        setUsername(value)
                        if (error) setError(undefined)
                    }}
                    placeholder="Enter your username"
                    variant="outline"
                    error={error}
                />

                <View className="flex-1" />

                <View className="flex-row gap-3 mb-4">
                    <Button
                        variant="outline"
                        onPress={() => router.back()}
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
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
