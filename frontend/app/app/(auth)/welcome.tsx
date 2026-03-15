import { View, ScrollView, Image, Pressable, Dimensions } from "react-native"
import { useRouter } from "expo-router"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom"
import { useGoogleAuth } from "@features/auth/hooks/useGoogleAuth"
import { Button, ViewErrors, Text } from "@components/core"
import { useEffect } from "react"
import { useThemeColors } from "@api/theme/useThemeColors"
import {
    Users,
    CalendarClock,
    Sparkles,
    MessageSquare,
    Shield,
    Zap,
    ChevronRight
} from "lucide-react-native"
import * as Application from "expo-application"

const { width: SCREEN_WIDTH } = Dimensions.get("window")

/**
 * The welcome / landing page.
 *
 * @author AJ Kneisl
 */
export default function WelcomeScreen() {
    const router = useRouter()
    const { signIn, loading, error, isReady } = useGoogleAuth()
    const colors = useThemeColors()

    const [auth] = useAtom(authToken)

    // go away if already authenticated
    useEffect(() => {
        if (auth && auth !== "") {
            router.replace("/(tabs)")
        }
    }, [auth, router])

    return (
        <ScrollView className="flex-1 bg-background">
            {/* Hero */}
            <View className="px-6 pt-16 pb-12">
                <View className="items-center mb-8">
                    <Image
                        source={require("@assets/images/burrow.png")}
                        style={{ width: 80, height: 80, marginBottom: 24 }}
                        resizeMode="contain"
                    />

                    <Text
                        className="text-center text-text font-extrabold mb-4"
                        style={{ fontSize: 40, lineHeight: 44, letterSpacing: -1.5 }}
                    >
                        Study groups,{"\n"}
                        <Text className="text-primary">made simple.</Text>
                    </Text>

                    <Text
                        className="text-text text-center font-sans opacity-60 max-w-xs"
                        style={{ fontSize: 17, lineHeight: 26 }}
                    >
                        Connect with classmates, join study sessions, and ace
                        your courses together.
                    </Text>
                </View>

                {/* CTA */}
                <View className="gap-3 mb-8">
                    {error && <ViewErrors error={error} className="mb-2" />}

                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onPress={signIn}
                        loading={loading}
                        disabled={!isReady || loading}
                    >
                        Get Started
                    </Button>

                    <Pressable
                        onPress={() => router.push("/(auth)/signin")}
                        className="py-3"
                    >
                        <Text className="text-text text-center font-medium text-sm opacity-50">
                            Sign in a different way
                        </Text>
                    </Pressable>
                </View>

                {/* Trust badges */}
                <View className="flex-row justify-center gap-6">
                    {["UMN Only", "Private", "Free"].map((label) => (
                        <View
                            key={label}
                            className="flex-row items-center gap-1.5"
                        >
                            <View className="w-1.5 h-1.5 rounded-full bg-secondary" />
                            <Text className="text-text font-medium text-xs opacity-40">
                                {label}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* How it works */}
            <View className="bg-card px-6 py-12">
                <Text
                    className="text-text font-bold text-xs uppercase opacity-40 mb-2"
                    style={{ letterSpacing: 1.5 }}
                >
                    How it works
                </Text>

                <Text
                    className="text-text font-bold mb-10"
                    style={{ fontSize: 28, letterSpacing: -0.5, lineHeight: 34 }}
                >
                    Three steps to{"\n"}get started
                </Text>

                <View className="gap-6">
                    <StepItem
                        number="01"
                        title="Sign in"
                        description="Use your UMN email to instantly join."
                        colors={colors}
                    />

                    <StepItem
                        number="02"
                        title="Find a Burrow"
                        description="Browse study groups or create your own."
                        colors={colors}
                    />

                    <StepItem
                        number="03"
                        title="Collaborate"
                        description="Study, build projects, or meet new people."
                        colors={colors}
                    />
                </View>
            </View>

            {/* Features */}
            <View className="bg-background px-6 py-12">
                <Text
                    className="text-text font-bold text-xs uppercase opacity-40 mb-2"
                    style={{ letterSpacing: 1.5 }}
                >
                    Features
                </Text>

                <Text
                    className="text-text font-bold mb-10"
                    style={{ fontSize: 28, letterSpacing: -0.5, lineHeight: 34 }}
                >
                    Everything you need
                </Text>

                <View className="flex-row flex-wrap gap-4">
                    <FeatureCard
                        icon={<Users size={22} color={colors.secondary} />}
                        title="Study groups"
                        description="Find groups for any class"
                    />
                    <FeatureCard
                        icon={<MessageSquare size={22} color={colors.secondary} />}
                        title="Built-in chat"
                        description="No juggling apps"
                    />
                    <FeatureCard
                        icon={<CalendarClock size={22} color={colors.secondary} />}
                        title="Scheduling"
                        description="Set times & locations"
                    />
                    <FeatureCard
                        icon={<Shield size={22} color={colors.secondary} />}
                        title="UMN verified"
                        description="Students only"
                    />
                    <FeatureCard
                        icon={<Zap size={22} color={colors.secondary} />}
                        title="Join instantly"
                        description="One tap to join"
                    />
                    <FeatureCard
                        icon={<Sparkles size={22} color={colors.secondary} />}
                        title="Multiple types"
                        description="Study, clubs, events"
                    />
                </View>
            </View>

            {/* Bottom CTA */}
            <View className="py-12">
                <View className="bg-card border border-card-border rounded-3xl mx-6 p-8 items-center">
                    <Text
                        className="text-text text-center font-bold mb-3"
                        style={{ fontSize: 24, letterSpacing: -0.5, lineHeight: 30 }}
                    >
                        Ready to find your{"\n"}study crew?
                    </Text>

                    <Text className="text-text text-center font-sans opacity-50 mb-8" style={{ fontSize: 15, lineHeight: 22 }}>
                        Join UMN students already studying smarter together.
                    </Text>

                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onPress={signIn}
                        loading={loading}
                        disabled={!isReady || loading}
                    >
                        Sign in with Google
                    </Button>

                    <Text className="text-text text-center font-sans text-xs opacity-45 mt-5">
                        UMN email required (@umn.edu)
                    </Text>
                </View>
            </View>

            {/* Footer */}
            <View className="px-6 pb-10 items-center">
                <View className="flex-row justify-center gap-6 mb-5">
                    <Pressable onPress={() => router.push("/settings/privacy")}>
                        <Text className="text-text font-medium text-xs opacity-50">
                            Privacy
                        </Text>
                    </Pressable>
                    <Pressable onPress={() => router.push("/settings/tos")}>
                        <Text className="text-text font-medium text-xs opacity-50">
                            Terms
                        </Text>
                    </Pressable>
                    <Pressable onPress={() => router.push("/settings/about")}>
                        <Text className="text-text font-medium text-xs opacity-50">
                            About
                        </Text>
                    </Pressable>
                </View>

                <Text className="text-text text-center font-sans opacity-35" style={{ fontSize: 11 }}>
                    {Application.nativeApplicationVersion ?? "INDEV"}
                </Text>
            </View>
        </ScrollView>
    )
}

/**
 * A step in the "How it works" section.
 */
function StepItem({
    number,
    title,
    description,
    colors
}: {
    number: string
    title: string
    description: string
    colors: ReturnType<typeof useThemeColors>
}) {
    return (
        <View className="flex-row items-center gap-4">
            <Text
                className="text-secondary font-bold opacity-40"
                style={{ fontSize: 32, width: 44 }}
            >
                {number}
            </Text>

            <View className="flex-1">
                <Text className="text-text font-semibold mb-1" style={{ fontSize: 17 }}>
                    {title}
                </Text>
                <Text className="text-text font-sans text-sm opacity-50" style={{ lineHeight: 20 }}>
                    {description}
                </Text>
            </View>

            <ChevronRight size={18} color={colors.text} style={{ opacity: 0.25 }} />
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
    const cardWidth = (SCREEN_WIDTH - 48 - 16) / 2

    return (
        <View
            className="bg-card border border-card-border rounded-2xl p-4"
            style={{ width: cardWidth }}
        >
            <View className="bg-secondary/10 w-11 h-11 rounded-xl items-center justify-center mb-3">
                {icon}
            </View>
            <Text className="text-text font-semibold mb-1" style={{ fontSize: 15 }}>
                {title}
            </Text>
            <Text className="text-text font-sans opacity-55" style={{ fontSize: 13, lineHeight: 18 }}>
                {description}
            </Text>
        </View>
    )
}
