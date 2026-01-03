import { View, Text, ScrollView, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { ArrowLeft, FileText } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import { Card } from "@components/core"

/**
 * Terms of Service screen.
 */
export default function TermsOfServiceScreen() {
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
                        Terms of Service
                    </Text>
                    <Text className="text-sm text-text text-opacity-60 mt-0.5">
                        Last updated: December 2024
                    </Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6 py-4">
                {/* Hero */}
                <Card variant="bordered" className="bg-primary bg-opacity-5 mb-6">
                    <View className="flex-row items-start gap-3">
                        <FileText size={24} color={colors.primary} />
                        <View className="flex-1">
                            <Text className="text-text font-semibold mb-2 text-lg">
                                Terms of Service
                            </Text>
                            <Text className="text-text text-opacity-70 text-sm">
                                By using Burrow, you agree to these terms.
                                Please read them carefully.
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Agreement to Terms */}
                <Section title="1. Agreement to Terms">
                    <SectionText>
                        By accessing or using Burrow, you agree to be bound by
                        these Terms of Service and our Privacy Policy. If you do
                        not agree to these terms, you may not use the service.
                    </SectionText>
                </Section>

                {/* Eligibility */}
                <Section title="2. Eligibility">
                    <SectionText>
                        Burrow is exclusively for students, faculty, and staff of
                        the University of Minnesota. You must:
                    </SectionText>
                    <BulletPoint>
                        Be at least 18 years old or have parental consent
                    </BulletPoint>
                    <BulletPoint>
                        Have a valid University of Minnesota account
                    </BulletPoint>
                    <BulletPoint>
                        Provide accurate and complete information
                    </BulletPoint>
                    <BulletPoint>
                        Maintain the security of your account
                    </BulletPoint>
                </Section>

                {/* Account Responsibilities */}
                <Section title="3. Account Responsibilities">
                    <SectionText>You are responsible for:</SectionText>
                    <BulletPoint>
                        Maintaining the confidentiality of your account
                    </BulletPoint>
                    <BulletPoint>
                        All activities that occur under your account
                    </BulletPoint>
                    <BulletPoint>
                        Notifying us immediately of any unauthorized use
                    </BulletPoint>
                </Section>

                {/* Acceptable Use */}
                <Section title="4. Acceptable Use">
                    <SectionText>You agree NOT to:</SectionText>
                    <BulletPoint>
                        Violate any laws or University policies
                    </BulletPoint>
                    <BulletPoint>
                        Harass, bully, or threaten other users
                    </BulletPoint>
                    <BulletPoint>
                        Share inappropriate or offensive content
                    </BulletPoint>
                    <BulletPoint>
                        Impersonate others or create fake accounts
                    </BulletPoint>
                    <BulletPoint>
                        Spam, advertise, or use the service for commercial
                        purposes
                    </BulletPoint>
                    <BulletPoint>
                        Attempt to access, modify, or disrupt the service
                    </BulletPoint>
                    <BulletPoint>
                        Share false or misleading information
                    </BulletPoint>
                </Section>

                {/* Content Ownership */}
                <Section title="5. Content Ownership">
                    <SectionText>
                        You retain ownership of content you create on Burrow
                        (messages, posts, burrows). By posting content, you grant
                        us a license to use, display, and distribute your content
                        within the service.
                    </SectionText>
                    <SectionText className="mt-3">
                        We reserve the right to remove content that violates
                        these terms or is otherwise inappropriate.
                    </SectionText>
                </Section>

                {/* University Affiliation */}
                <Section title="6. University Affiliation">
                    <SectionText>
                        Burrow is an independent student project and is not
                        officially affiliated with or endorsed by the University
                        of Minnesota. However, we may share information with the
                        University when required or when safety concerns arise.
                    </SectionText>
                </Section>

                {/* Service Availability */}
                <Section title="7. Service Availability">
                    <SectionText>
                        We strive to keep Burrow available at all times, but we
                        do not guarantee uninterrupted access. We may:
                    </SectionText>
                    <BulletPoint>
                        Modify or discontinue features without notice
                    </BulletPoint>
                    <BulletPoint>
                        Perform maintenance that temporarily limits access
                    </BulletPoint>
                    <BulletPoint>
                        Update these terms from time to time
                    </BulletPoint>
                </Section>

                {/* Termination */}
                <Section title="8. Termination">
                    <SectionText>
                        We reserve the right to suspend or terminate your account
                        if you:
                    </SectionText>
                    <BulletPoint>Violate these terms</BulletPoint>
                    <BulletPoint>
                        Engage in behavior harmful to other users
                    </BulletPoint>
                    <BulletPoint>Are no longer eligible to use Burrow</BulletPoint>
                    <SectionText className="mt-3">
                        You may delete your account at any time through the app
                        settings.
                    </SectionText>
                </Section>

                {/* Disclaimer of Warranties */}
                <Section title="9. Disclaimer of Warranties">
                    <SectionText>
                        Burrow is provided "as is" without warranties of any
                        kind. We do not guarantee that the service will be
                        error-free, secure, or always available. Use at your own
                        risk.
                    </SectionText>
                </Section>

                {/* Limitation of Liability */}
                <Section title="10. Limitation of Liability">
                    <SectionText>
                        To the maximum extent permitted by law, Burrow and its
                        team members shall not be liable for any indirect,
                        incidental, special, or consequential damages arising
                        from your use of the service.
                    </SectionText>
                </Section>

                {/* Governing Law */}
                <Section title="11. Governing Law">
                    <SectionText>
                        These terms are governed by the laws of the State of
                        Minnesota. Any disputes shall be resolved in the courts
                        of Minnesota.
                    </SectionText>
                </Section>

                {/* Changes to Terms */}
                <Section title="12. Changes to Terms">
                    <SectionText>
                        We may update these Terms of Service from time to time.
                        We will notify you of significant changes by posting a
                        notice in the app or via email. Continued use of Burrow
                        after changes constitutes acceptance of the new terms.
                    </SectionText>
                </Section>

                {/* Contact Information */}
                <Section title="13. Contact Information">
                    <SectionText>
                        Questions about these Terms of Service? Contact us at:
                    </SectionText>
                    <SectionText className="mt-2">
                        Email: support@umn.app{"\n"}
                        Website: umn.app{"\n"}
                        GitHub: github.com/ajkneisl/burrow
                    </SectionText>
                </Section>

                {/* Acknowledgment */}
                <Card variant="bordered" className="bg-info bg-opacity-5">
                    <Text className="text-text text-opacity-80 text-sm leading-relaxed">
                        By using Burrow, you acknowledge that you have read,
                        understood, and agree to be bound by these Terms of
                        Service.
                    </Text>
                </Card>

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
