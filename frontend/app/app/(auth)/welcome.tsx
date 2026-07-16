import { View, ScrollView, Image, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom"
import { useGoogleAuth } from "@features/auth/hooks/useGoogleAuth"
import { Button, ViewErrors, Text } from "@components/core"
import { useEffect } from "react"
import { useThemeColors } from "@api/theme/useThemeColors"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { StatusBar } from "expo-status-bar"
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated"
import * as Haptics from "expo-haptics"
import {
    Users,
    CalendarClock,
    PartyPopper,
    MessageSquare,
    Shield,
    Zap
} from "lucide-react-native"
import * as Application from "expo-application"

/** UMN maroon gradient shared by the hero and the bottom CTA card. */
const MAROON_GRADIENT =
    "linear-gradient(165deg, #96233c 0%, #7a0019 45%, #45000e 100%)"

/** Soft gold glow layered on top of the maroon surfaces. */
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
    const colors = useThemeColors()
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
        <ScrollView
            className="flex-1 bg-background"
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
        >
            <StatusBar style="light" />

            {/* Hero */}
            <View
                className="px-6 pb-12 overflow-hidden"
                style={{
                    paddingTop: insets.top + 48,
                    backgroundColor: "#7a0019",
                    experimental_backgroundImage: MAROON_GRADIENT,
                    borderBottomLeftRadius: 36,
                    borderBottomRightRadius: 36,
                    borderCurve: "continuous"
                }}
            >
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

                <Animated.View
                    entering={FadeInDown.duration(500)}
                    className="items-center mb-8"
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
                        Find classmates, plan study sessions, and keep your
                        group in one place.
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
            </View>

            {/* How it works */}
            <Animated.View
                entering={FadeInUp.delay(200).duration(500)}
                className="px-6 pt-14 pb-6"
            >
                <Text
                    className="text-primary font-bold text-xs uppercase mb-2"
                    style={{ letterSpacing: 2 }}
                >
                    How it works
                </Text>

                <Text
                    className="text-text font-figtree mb-8"
                    style={{ fontSize: 30, letterSpacing: -0.5, lineHeight: 36 }}
                >
                    Three steps to{"\n"}get started
                </Text>

                <View>
                    <StepItem
                        number="1"
                        title="Sign in"
                        description="Use your UMN email to instantly join."
                    />

                    <StepItem
                        number="2"
                        title="Find a Burrow"
                        description="Browse study groups or create your own."
                    />

                    <StepItem
                        number="3"
                        title="Collaborate"
                        description="Study, build projects, or meet new people."
                        isLast
                    />
                </View>
            </Animated.View>

            {/* Features */}
            <View className="px-6 pt-8 pb-12">
                <Text
                    className="text-primary font-bold text-xs uppercase mb-2"
                    style={{ letterSpacing: 2 }}
                >
                    Features
                </Text>

                <Text
                    className="text-text font-figtree mb-8"
                    style={{ fontSize: 30, letterSpacing: -0.5, lineHeight: 36 }}
                >
                    What you get
                </Text>

                <View className="flex-row flex-wrap gap-3">
                    <FeatureCard
                        icon={<Users size={22} color={colors.primary} />}
                        title="Study groups"
                        description="Find groups for any class"
                    />
                    <FeatureCard
                        icon={<MessageSquare size={22} color={colors.primary} />}
                        title="Built-in chat"
                        description="Talk with your group"
                    />
                    <FeatureCard
                        icon={<CalendarClock size={22} color={colors.primary} />}
                        title="Scheduling"
                        description="Set times & locations"
                    />
                    <FeatureCard
                        icon={<Shield size={22} color={colors.primary} />}
                        title="UMN verified"
                        description="Students only"
                    />
                    <FeatureCard
                        icon={<Zap size={22} color={colors.primary} />}
                        title="Join instantly"
                        description="One tap to join"
                    />
                    <FeatureCard
                        icon={<PartyPopper size={22} color={colors.primary} />}
                        title="Clubs & events"
                        description="More than just studying"
                    />
                </View>
            </View>

            {/* Bottom CTA */}
            <View className="px-6 pb-12">
                <View
                    className="p-8 items-center overflow-hidden"
                    style={{
                        borderRadius: 28,
                        borderCurve: "continuous",
                        backgroundColor: "#7a0019",
                        experimental_backgroundImage: MAROON_GRADIENT
                    }}
                >
                    <View
                        className="absolute"
                        style={{
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 220,
                            experimental_backgroundImage: GOLD_GLOW
                        }}
                    />

                    <Text
                        className="text-center font-figtree text-white mb-8"
                        style={{
                            fontSize: 26,
                            letterSpacing: -0.5,
                            lineHeight: 32
                        }}
                    >
                        Ready to get started?
                    </Text>

                    <Button
                        variant="secondary"
                        size="lg"
                        fullWidth
                        onPress={handleSignIn}
                        loading={loading}
                        disabled={!isReady || loading}
                    >
                        Sign in with Google
                    </Button>

                    <Text
                        className="text-center font-sans text-xs mt-5"
                        style={{ color: "rgba(255,255,255,0.55)" }}
                    >
                        UMN email required (@umn.edu)
                    </Text>
                </View>
            </View>

            {/* Footer */}
            <View className="px-6 items-center">
                <View className="flex-row items-center justify-center gap-3 mb-5">
                    <Pressable onPress={() => router.push("/settings/privacy")} hitSlop={8}>
                        <Text className="text-text font-medium text-xs opacity-50">
                            Privacy
                        </Text>
                    </Pressable>
                    <View className="w-1 h-1 rounded-full bg-text opacity-25" />
                    <Pressable onPress={() => router.push("/settings/tos")} hitSlop={8}>
                        <Text className="text-text font-medium text-xs opacity-50">
                            Terms
                        </Text>
                    </Pressable>
                    <View className="w-1 h-1 rounded-full bg-text opacity-25" />
                    <Pressable onPress={() => router.push("/settings/about")} hitSlop={8}>
                        <Text className="text-text font-medium text-xs opacity-50">
                            About
                        </Text>
                    </Pressable>
                </View>

                <Text
                    className="text-text text-center font-sans opacity-35"
                    style={{ fontSize: 11 }}
                >
                    {Application.nativeApplicationVersion ?? "INDEV"}
                </Text>
            </View>
        </ScrollView>
    )
}

/**
 * A step in the "How it works" timeline.
 */
function StepItem({
    number,
    title,
    description,
    isLast = false
}: {
    number: string
    title: string
    description: string
    isLast?: boolean
}) {
    return (
        <View className="flex-row gap-4">
            <View className="items-center">
                <View
                    className="bg-primary/10 items-center justify-center"
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20
                    }}
                >
                    <Text className="text-primary font-bold" style={{ fontSize: 16 }}>
                        {number}
                    </Text>
                </View>

                {!isLast && (
                    <View
                        className="flex-1 bg-card-border my-1.5"
                        style={{ width: 2, borderRadius: 1 }}
                    />
                )}
            </View>

            <View className={isLast ? "flex-1 pt-1.5" : "flex-1 pt-1.5 pb-7"}>
                <Text className="text-text font-semibold mb-1" style={{ fontSize: 17 }}>
                    {title}
                </Text>
                <Text
                    className="text-text font-sans text-sm opacity-50"
                    style={{ lineHeight: 20 }}
                >
                    {description}
                </Text>
            </View>
        </View>
    )
}

/**
 * A feature card in the grid.
 */
function FeatureCard({
    icon,
    title,
    description
}: {
    icon: React.ReactNode
    title: string
    description: string
}) {
    return (
        <View
            className="bg-card border border-card-border rounded-2xl p-4"
            style={{
                flexBasis: "47%",
                flexGrow: 1,
                borderCurve: "continuous",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)"
            }}
        >
            <View
                className="bg-primary/10 items-center justify-center mb-3"
                style={{
                    width: 44,
                    height: 44,
                    borderRadius: 13,
                    borderCurve: "continuous"
                }}
            >
                {icon}
            </View>
            <Text className="text-text font-semibold mb-1" style={{ fontSize: 15 }}>
                {title}
            </Text>
            <Text
                className="text-text font-sans opacity-55"
                style={{ fontSize: 13, lineHeight: 18 }}
            >
                {description}
            </Text>
        </View>
    )
}
