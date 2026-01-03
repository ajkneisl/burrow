import { View, Text, ScrollView, Image, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom"
import { useGoogleAuth } from "@features/auth/hooks/useGoogleAuth"
import { Button, ViewErrors } from "@components/core"
import { useEffect } from "react"
import { useThemeColors } from "@api/theme/useThemeColors"
import {
    Users,
    CalendarClock,
    Sparkles,
    MessageSquare,
    Shield,
    Zap,
    CheckCircle2
} from "lucide-react-native"

/**
 * The welcome / landing page.
 *
 * @author AJ Kneisl
 */
export default function WelcomeScreen() {
    const router = useRouter()
    const [auth] = useAtom(authToken)
    const { signIn, loading, error, isReady } = useGoogleAuth()
    const colors = useThemeColors()

    // go away if already authenticated
    useEffect(() => {
        if (auth && auth !== "") {
            router.replace("/(tabs)")
        }
    }, [auth, router])

    return (
        <ScrollView className="flex-1 bg-background">
            {/* hero */}
            <View className="bg-background px-6 pt-8 pb-6">
                {/* bannger */}
                <View className="mb-6 overflow-hidden rounded-2xl">
                    <View className="bg-gradient-to-b from-primary/20 to-secondary/10 p-8 items-center">
                        <Image
                            source={require("@assets/images/burrow.png")}
                            style={{
                                width: 100,
                                height: 100,
                                marginBottom: 16
                            }}
                            resizeMode="contain"
                        />

                        <Text className="text-4xl font-extrabold text-center text-text mb-4 leading-tight">
                            Study groups,{"\n"}
                            <Text className="text-primary">made simple</Text>
                        </Text>

                        <Text className="text-lg text-text text-opacity-80 text-center font-medium max-w-md">
                            Connect with classmates, join study sessions, and
                            ace your courses together. All in one place.
                        </Text>
                    </View>
                </View>

                {/* made by gophers */}
                <View className="items-center mb-4">
                    <View className="bg-secondary/10 rounded-full px-6 py-3 flex-row items-center gap-2">
                        <Text className="text-secondary text-sm font-semibold">
                            Made by Gophers, for Gophers
                        </Text>
                    </View>
                </View>

                {/* trust */}
                <View className="flex-row flex-wrap items-center justify-center gap-4">
                    <View className="flex-row items-center gap-1.5">
                        <CheckCircle2 size={16} color={colors.secondary} />
                        <Text className="text-text text-opacity-60 text-sm">
                            All Majors
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                        <CheckCircle2 size={16} color={colors.secondary} />
                        <Text className="text-text text-opacity-60 text-sm">
                            Secure & Private
                        </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                        <CheckCircle2 size={16} color={colors.secondary} />
                        <Text className="text-text text-opacity-60 text-sm">
                            Completely Free
                        </Text>
                    </View>
                </View>
            </View>

            {/* gow it works */}
            <View className="bg-card px-6 py-12">
                <Text className="text-3xl font-bold text-text text-center mb-3">
                    How it works
                </Text>
                <Text className="text-text text-opacity-80 text-center mb-8 text-base font-medium">
                    Getting started is easier than finding a parking spot on
                    campus
                </Text>

                <View className="gap-8">
                    <StepItem
                        number="1"
                        title="Sign in with Google"
                        description="Use your UMN email to instantly join. No setup, no hassle."
                    />
                    <StepItem
                        number="2"
                        title="Find or create a Burrow"
                        description="Browse study groups for your classes or start your own in seconds."
                    />
                    <StepItem
                        number="3"
                        title="Start collaborating"
                        description="Study with classmates, work together on a project, or simply meet new people."
                    />
                </View>
            </View>

            {/* features */}
            <View className="bg-background px-6 py-12">
                <Text className="text-3xl font-bold text-text text-center mb-8">
                    Everything you need,{"\n"}nothing you don't
                </Text>

                <View className="gap-6">
                    <FeatureItem
                        icon={<Users size={20} color={colors.secondary} />}
                        title="Browse study groups"
                        description="Find groups for any class, with filters for time and location"
                    />

                    <FeatureItem
                        icon={
                            <MessageSquare size={20} color={colors.secondary} />
                        }
                        title="Built-in chat"
                        description="Message your group without juggling apps"
                    />

                    <FeatureItem
                        icon={
                            <CalendarClock size={20} color={colors.secondary} />
                        }
                        title="Smart scheduling"
                        description="Set times and locations that work for everyone"
                    />

                    <FeatureItem
                        icon={<Shield size={20} color={colors.secondary} />}
                        title="UMN students only"
                        description="Verified accounts keep things safe and relevant"
                    />

                    <FeatureItem
                        icon={<Zap size={20} color={colors.secondary} />}
                        title="Join instantly"
                        description="One click to join any group that has space"
                    />

                    <FeatureItem
                        icon={<Sparkles size={20} color={colors.secondary} />}
                        title="Multiple types"
                        description="Study sessions, club meetings, or events"
                    />
                </View>
            </View>

            {/* join */}
            <View className="bg-card px-6 py-12">
                <View className="bg-background rounded-2xl p-6 mb-8">
                    <Text className="text-3xl font-bold text-text text-center mb-4">
                        Ready to find your study crew?
                    </Text>
                    <Text className="text-text text-opacity-80 text-center mb-6 text-base font-medium">
                        Join hundreds of UMN students already studying smarter
                        together
                    </Text>

                    {error && <ViewErrors error={error} className="mb-4" />}

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

                    <Button
                        variant="ghost"
                        size="lg"
                        fullWidth
                        onPress={() => router.push("/(auth)/signin")}
                    >
                        or sign in a different way
                    </Button>

                    <Text className="text-xs text-text text-opacity-60 text-center mt-4 mb-3">
                        By signing in, you agree to our Privacy Policy and Terms
                        of Service
                    </Text>

                    <Text className="text-sm text-text text-opacity-60 text-center">
                        UMN email required (@umn.edu)
                    </Text>
                </View>

                {/* footer */}
                <View className="items-center">
                    <View className="flex-row justify-center gap-6 mb-6">
                        <Pressable
                            onPress={() => router.push("/settings/privacy")}
                        >
                            <Text className="text-sm text-text text-opacity-80">
                                Privacy Policy
                            </Text>
                        </Pressable>
                        <Pressable onPress={() => router.push("/settings/tos")}>
                            <Text className="text-sm text-text text-opacity-80">
                                Terms of Service
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => router.push("/settings/about")}
                        >
                            <Text className="text-sm text-text text-opacity-80">
                                About
                            </Text>
                        </Pressable>
                    </View>

                    <Text className="text-xs text-text text-opacity-40 text-center mb-4">
                        Version 0.4.0
                    </Text>
                </View>
            </View>
        </ScrollView>
    )
}

/**
 * An item in Step section.
 *
 * @param number The step number.
 * @param title The title of the step.
 * @param description The description of the step.
 */
function StepItem({
    number,
    title,
    description
}: {
    number: string
    title: string
    description: string
}) {
    return (
        <View className="flex-row items-start gap-4">
            <View className="bg-secondary/10 h-16 w-16 rounded-2xl items-center justify-center">
                <Text className="text-secondary text-2xl font-bold">
                    {number}
                </Text>
            </View>
            <View className="flex-1">
                <Text className="text-text text-lg font-bold mb-2">
                    {title}
                </Text>
                <Text className="text-text text-opacity-80 text-base">
                    {description}
                </Text>
            </View>
        </View>
    )
}

/**
 * An individual feature.
 *
 * @param icon An icon describing the feature.
 * @param title The title of the feature.
 * @param description A description of the feature.
 */
function FeatureItem({
    icon,
    title,
    description
}: {
    icon: React.ReactNode
    title: string
    description: string
}) {
    return (
        <View className="flex-row gap-4">
            <View className="bg-secondary/10 h-10 w-10 rounded-lg items-center justify-center flex-shrink-0">
                {icon}
            </View>
            <View className="flex-1">
                <Text className="text-text font-semibold mb-1">{title}</Text>
                <Text className="text-text text-opacity-75 text-sm font-medium">
                    {description}
                </Text>
            </View>
        </View>
    )
}
