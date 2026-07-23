import { View, ScrollView, Alert } from "react-native"
import { useRouter } from "expo-router"
import { useAtom, useSetAtom } from "jotai"
import { authToken, refreshTokenAtom, userDetails } from "@features/auth/auth.atom"
import { Button, Input, Text } from "@components/core"
import { useState, useEffect } from "react"
import { useThemeColors } from "@api/theme/useThemeColors"
import { ArrowLeft } from "lucide-react-native"
import * as Device from "expo-device"
import { altLogin } from "@features/auth/user.api"
import { store } from "@api/api.atom"
import Toast from "react-native-toast-message"

/**
 * Page with username and password for special cases & debugging.
 *
 * @author AJ Kneisl
 */
export default function SignInScreen() {
    const router = useRouter()
    const [auth, setAuthToken] = useAtom(authToken)
    const setUser = useSetAtom(userDetails)
    const colors = useThemeColors()

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    // go away if already authenticated
    useEffect(() => {
        if (auth && auth !== "") {
            router.replace("/(tabs)")
        }
    }, [auth, router])

    const handleSignIn = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert("Error", "Please enter both username and password")
            return
        }

        setLoading(true)
        try {
            const deviceName = Device.deviceName || `${Device.brand ?? ""} ${Device.modelName ?? ""}`.trim() || "Mobile Device"
            const response = await altLogin(username.trim(), password, deviceName)

            // update auth token
            void setAuthToken(response.token)
            await store.set(refreshTokenAtom, response.refreshToken)
            setUser(response.user)

            Toast.show({
                type: "success",
                text1: "Welcome back!",
                text2: "Successfully signed in"
            })

            // navigate back
            router.replace("/(tabs)")
        } catch (error: any) {
            Alert.alert(
                "Sign In Failed",
                error.message ||
                    "Invalid username or password. Please try again."
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <ScrollView className="flex-1 bg-background">
            <View className="px-6 py-12">
                {/* back button */}
                <View className="mb-8">
                    <Button
                        variant="ghost"
                        size="md"
                        onPress={() => router.back()}
                        leftIcon={<ArrowLeft size={20} color={colors.text} />}
                    >
                        Back to Welcome
                    </Button>
                </View>

                {/* header */}
                <View className="mb-8">
                    <Text className="text-3xl font-bold text-text mb-3">
                        Alternative Sign In
                    </Text>

                    {/* notice for students */}
                    <View className="bg-red-500/30 border border-red-800/30 border-opacity-10 rounded-lg p-4">
                        <Text className="text-text font-semibold mb-2">
                            Note
                        </Text>

                        <Text className="text-text text-opacity-80 text-sm">
                            If you're a student, please use the{" "}
                            <Text className="font-semibold">
                                "Sign in with Google"
                            </Text>{" "}
                            button on the welcome page.
                        </Text>
                    </View>
                </View>

                {/* Sign In Form */}
                <View>
                    {/* username input */}
                    <Input
                        label="Username"
                        value={username}
                        onChangeText={setUsername}
                        placeholder="Enter your username"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                    />

                    {/* password input */}
                    <Input
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!loading}
                    />

                    {/* sign in button */}
                    <View className="mt-2">
                        <Button
                            variant="primary"
                            size="lg"
                            fullWidth
                            onPress={handleSignIn}
                            loading={loading}
                            disabled={loading}
                        >
                            Sign In
                        </Button>
                    </View>
                </View>

                {/* help */}
                <View className="mt-8">
                    <Text className="text-text text-opacity-60 text-center text-sm">
                        Need help? Please contact us at{" "}
                        <Text className="font-monospace">support@umn.app</Text>.
                    </Text>
                </View>
            </View>
        </ScrollView>
    )
}
