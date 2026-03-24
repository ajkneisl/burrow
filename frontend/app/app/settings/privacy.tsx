import { View, ScrollView, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { ArrowLeft, Shield } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import { Card, Text } from "@components/core"

/**
 * Privacy Policy screen.
 */
export default function PrivacyScreen() {
    const router = useRouter()
    const colors = useThemeColors()

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 py-4 border-b border-card-border flex-row items-center">
                <Pressable
                    onPress={() => router.back()}
                    className="p-2 mr-2 -ml-2"
                >
                    <ArrowLeft size={24} color={colors.text} />
                </Pressable>
                <View className="flex-1">
                    <Text className="text-2xl font-bold text-text">
                        Privacy Policy
                    </Text>
                    <Text className="text-sm text-text text-opacity-60 mt-0.5">
                        Last updated: December 2024
                    </Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
                {/* Hero */}
                <Card variant="bordered" className="bg-opacity-5 mb-6">
                    <View className="flex-row items-start gap-3">
                        <Shield size={24} color={colors.primary} />

                        <View className="flex-1">
                            <Text className="text-text font-semibold mb-2 text-lg">
                                Your Privacy Matters
                            </Text>
                            <Text className="text-text text-opacity-70 text-sm">
                                Burrow is committed to protecting your privacy
                                and being transparent about how we collect, use,
                                and share your information.
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Information We Collect */}
                <Section title="1. Information We Collect">
                    <SectionText>
                        We collect information that you provide directly to us,
                        including:
                    </SectionText>
                    <BulletPoint>
                        Account information (name, email, University of Minnesota
                        credentials)
                    </BulletPoint>
                    <BulletPoint>
                        Profile information (username, bio, profile picture)
                    </BulletPoint>
                    <BulletPoint>
                        Content you create (burrows, messages, posts)
                    </BulletPoint>
                    <BulletPoint>
                        Usage data (app interactions, device information)
                    </BulletPoint>
                </Section>

                {/* How We Use Your Information */}
                <Section title="2. How We Use Your Information">
                    <SectionText>We use the information we collect to:</SectionText>
                    <BulletPoint>
                        Provide, maintain, and improve our services
                    </BulletPoint>
                    <BulletPoint>
                        Facilitate connections between students
                    </BulletPoint>
                    <BulletPoint>
                        Send you notifications about burrows and updates
                    </BulletPoint>
                    <BulletPoint>
                        Ensure safety and prevent abuse
                    </BulletPoint>
                    <BulletPoint>
                        Analyze usage patterns to improve the app
                    </BulletPoint>
                </Section>

                {/* Information Sharing */}
                <Section title="3. Information Sharing">
                    <SectionText>
                        We share your information only in the following
                        circumstances:
                    </SectionText>
                    <BulletPoint>
                        <Text className="font-semibold">With other users:</Text>{" "}
                        Your profile and burrow activity are visible to other
                        Burrow users
                    </BulletPoint>
                    <BulletPoint>
                        <Text className="font-semibold">
                            With the University:
                        </Text>{" "}
                        We may report safety concerns to the University of
                        Minnesota
                    </BulletPoint>
                    <BulletPoint>
                        <Text className="font-semibold">Legal requirements:</Text>{" "}
                        When required by law or to protect our rights
                    </BulletPoint>
                    <SectionText className="mt-3">
                        We do not sell your personal information to third parties.
                    </SectionText>
                </Section>

                {/* University Authentication */}
                <Section title="4. University Authentication">
                    <SectionText>
                        Burrow requires authentication through your University of
                        Minnesota credentials. This ensures that only verified
                        students can access the platform. We use OAuth for
                        authentication and do not store your University password.
                    </SectionText>
                </Section>

                {/* Data Security */}
                <Section title="5. Data Security">
                    <SectionText>
                        We implement appropriate technical and organizational
                        measures to protect your information. However, no method
                        of transmission over the Internet is 100% secure. We
                        cannot guarantee absolute security but continuously work
                        to protect your data.
                    </SectionText>
                </Section>

                {/* Your Rights */}
                <Section title="6. Your Rights">
                    <SectionText>You have the right to:</SectionText>
                    <BulletPoint>Access your personal information</BulletPoint>
                    <BulletPoint>
                        Request correction of inaccurate data
                    </BulletPoint>
                    <BulletPoint>Request deletion of your account</BulletPoint>
                    <BulletPoint>
                        Control notification preferences
                    </BulletPoint>
                    <SectionText className="mt-3">
                        To exercise these rights, contact us at support@umn.app
                    </SectionText>
                </Section>

                {/* Children's Privacy */}
                <Section title="7. Children's Privacy">
                    <SectionText>
                        Burrow is intended for use by university students aged 18
                        and older. We do not knowingly collect information from
                        children under 18.
                    </SectionText>
                </Section>

                {/* Changes to This Policy */}
                <Section title="8. Changes to This Policy">
                    <SectionText>
                        We may update this Privacy Policy from time to time. We
                        will notify you of any changes by posting the new Privacy
                        Policy on this page and updating the "Last updated" date.
                    </SectionText>
                </Section>

                {/* Contact Us */}
                <Section title="9. Contact Us">
                    <SectionText>
                        If you have questions about this Privacy Policy, please
                        contact us at:
                    </SectionText>
                    <SectionText className="mt-2">
                        Email: support@umn.app{"\n"}
                        Website: umn.app
                    </SectionText>
                </Section>

                {/* Bottom Spacer */}
                <View className="h-12" />
            </ScrollView>
        </SafeAreaView>
    )
}

function Section({
    title,
    children
}: {
    title: string
    children: React.ReactNode
}) {
    return (
        <View className="mb-6">
            <Text className="text-text font-bold text-base mb-3">{title}</Text>
            {children}
        </View>
    )
}

function SectionText({
    children,
    className
}: {
    children: React.ReactNode
    className?: string
}) {
    return (
        <Text
            className={`text-text text-opacity-80 text-sm leading-relaxed ${className || ""}`}
        >
            {children}
        </Text>
    )
}

function BulletPoint({ children }: { children: React.ReactNode }) {
    return (
        <View className="flex-row mb-2">
            <Text className="text-text text-opacity-60 mr-2">•</Text>
            <Text className="text-text text-opacity-80 text-sm flex-1 leading-relaxed">
                {children}
            </Text>
        </View>
    )
}
