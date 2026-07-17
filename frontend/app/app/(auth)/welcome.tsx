import { View, Image, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom"
import { useGoogleAuth } from "@features/auth/hooks/useGoogleAuth"
import { Button, ViewErrors, Text } from "@components/core"
import { useEffect } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import Animated, { FadeInDown } from "react-native-reanimated"
import * as Haptics from "expo-haptics"
import * as Application from "expo-application"

/** UMN maroon gradient covering the whole page. */
const MAROON_GRADIENT =
    "linear-gradient(165deg, #96233c 0%, #7a0019 45%, #45000e 100%)"

/** Soft gold glow layered on top of the maroon surface. */
const GOLD_GLOW =
    "radial-gradient(circle at 50% 30%, rgba(255,204,0,0.22) 0%, rgba(255,204,0,0) 60%)"

/**
 * The welcome / landing page.
 *
 * @author AJ Kneisl
 */
export default function WelcomeScreen() {
    const router = useRouter()
    const { signIn, loading, error, isReady } = useGoogleAuth()
    const insets = useSafeAreaInsets()

    const [auth] = useAtom(authToken)

    // go away if already authenticated
    useEffect(() => {
        if (auth && auth !== "") {
            router.replace("/(tabs)")
        }
    }, [auth, router])

    const handleSignIn = () => {
        if (process.env.EXPO_OS === "ios") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        }
        signIn()
    }

    return (
        <View
            className="flex-1 px-6 overflow-hidden"
            style={{
                paddingTop: insets.top,
                paddingBottom: insets.bottom + 16,
                backgroundColor: "#7a0019",
                experimental_backgroundImage: MAROON_GRADIENT
            }}
        >
            <StatusBar style="light" />

            {/* Decorative shapes */}
            <View
                className="absolute"
                style={{
                    top: -80,
                    left: -100,
                    width: 320,
                    height: 320,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.05)"
                }}
            />
            <View
                className="absolute"
                style={{
                    top: 120,
                    right: -120,
                    width: 280,
                    height: 280,
                    borderRadius: 999,
                    backgroundColor: "rgba(255,255,255,0.04)"
                }}
            />
            <View
                className="absolute"
                style={{
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 360,
                    experimental_backgroundImage: GOLD_GLOW
                }}
            />

            {/* Hero */}
            <Animated.View
                entering={FadeInDown.duration(500)}
                className="flex-1 items-center justify-center"
            >
                <Image
                    source={require("@assets/images/burrow.png")}
                    style={{ width: 96, height: 96, marginBottom: 24 }}
                    resizeMode="contain"
                />

                <Text
                    className="text-center font-figtree text-white mb-4"
                    style={{
                        fontSize: 42,
                        lineHeight: 46,
                        letterSpacing: -1
                    }}
                >
                    Study groups,{"\n"}
                    <Text className="font-figtree text-secondary">
                        made simple.
                    </Text>
                </Text>

                <Text
                    className="text-center font-sans max-w-xs"
                    style={{
                        fontSize: 17,
                        lineHeight: 26,
                        color: "rgba(255,255,255,0.75)"
                    }}
                >
                    Find classmates, plan study sessions, and keep your group in
                    one place.
                </Text>
            </Animated.View>

            {/* CTA */}
            <Animated.View
                entering={FadeInDown.delay(120).duration(500)}
                className="gap-4"
            >
                {error && <ViewErrors error={error} className="mb-2" />}

                <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onPress={handleSignIn}
                    loading={loading}
                    disabled={!isReady || loading}
                >
                    Get Started
                </Button>

                <Pressable
                    onPress={() => router.push("/(auth)/signin")}
                    hitSlop={8}
                    className="items-center"
                >
                    <Text
                        className="font-semibold text-sm"
                        style={{ color: "rgba(255,255,255,0.7)" }}
                    >
                        Sign in a different way
                    </Text>
                </Pressable>
            </Animated.View>

            {/* Footer */}
            <View className="items-center mt-8">
                <View className="flex-row items-center justify-center gap-3 mb-3">
                    <Pressable
                        onPress={() => router.push("/settings/privacy")}
                        hitSlop={8}
                    >
                        <Text
                            className="font-medium text-xs"
                            style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                            Privacy
                        </Text>
                    </Pressable>
                    <View
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
                    />
                    <Pressable
                        onPress={() => router.push("/settings/tos")}
                        hitSlop={8}
                    >
                        <Text
                            className="font-medium text-xs"
                            style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                            Terms
                        </Text>
                    </Pressable>
                    <View
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
                    />
                    <Pressable
                        onPress={() => router.push("/settings/about")}
                        hitSlop={8}
                    >
                        <Text
                            className="font-medium text-xs"
                            style={{ color: "rgba(255,255,255,0.5)" }}
                        >
                            About
                        </Text>
                    </Pressable>
                </View>

                <Text
                    className="text-center font-sans"
                    style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}
                >
                    {Application.nativeApplicationVersion ?? "INDEV"}
                </Text>
            </View>
        </View>
    )
}
