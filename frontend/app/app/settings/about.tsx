import { View, Text, ScrollView, Pressable, Image, Linking } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { useState } from "react"
import { ArrowLeft, ChevronDown, ExternalLink } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import { Card } from "@components/core"
import * as Application from "expo-application"

const teamMembers = [
    {
        name: "AJ Kneisl",
        role: "App, Web, & Backend",
        image: "https://umn.app/image/team/aj.jpeg",
        linkedin: "https://www.linkedin.com/in/ajkn/",
        lead: true
    },
    {
        name: "Joshua Westerlund",
        role: "Design & Outreach",
        image: "https://umn.app/image/team/josh.jpeg",
        linkedin: "https://www.linkedin.com/in/weste637/"
    },
    {
        name: "Yordanos Eshete",
        role: "Web Developer & Outreach",
        image: "https://umn.app/image/team/yord.jpeg",
        linkedin: "https://www.linkedin.com/in/yordanoseshete/"
    },
    {
        name: "Ben Stortroen",
        role: "Web Developer",
        image: "https://umn.app/image/team/ben.jpeg",
        linkedin: "https://www.linkedin.com/in/benjamin-stortroen-b61400347/"
    },
    {
        name: "Thien-Tri Nguyen",
        role: "Design & Web Developer",
        image: "https://umn.app/image/team/tri.jpeg",
        linkedin: "https://www.linkedin.com/in/thientri-nguyen/"
    }
]

const faqItems = [
    {
        id: "how-find",
        question: "How do I find a study group?",
        answer: "You can find a study group by searching on the home page or browsing all burrows. Search for relevant coursework or topics to find groups that match your interests."
    },
    {
        id: "how-built",
        question: "How was Burrow built?",
        answer: "Burrow was built using Kotlin & Ktor for the backend, paired with MinIO for image hosting and PostgreSQL for the database. The frontend uses React with TypeScript and TailwindCSS. The mobile app uses React Native and Expo. View the code on GitHub at github.com/ajkneisl/burrow"
    },
    {
        id: "how-create",
        question: "How do I create my own Burrow?",
        answer: 'Tap the "+" button at the bottom of the app and choose your wanted type of Burrow. Then, follow through the process and fill in the correct details.'
    },
    {
        id: "how-join",
        question: "How do I join a Burrow?",
        answer: "Once you find a Burrow you're interested in, tap the Burrow and find the \"Join\" button. If the Burrow is full, you will be added to the waitlist. Otherwise, you're in and can begin chatting with other members."
    },
    {
        id: "safety",
        question: "What are the safety measures?",
        answer: "We take your safety seriously. All users must authenticate with their University of Minnesota credentials. If you have any concerns, please email us at support@umn.app"
    },
    {
        id: "how-cancel",
        question: "How do I cancel a Burrow?",
        answer: "Navigate to your Burrow's page and tap \"Delete\". You'll be asked to confirm, and if so, the Burrow will be deleted."
    }
]

/**
 * About Burrow screen.
 *
 * @author AJ Kneisl
 */
export default function AboutScreen() {
    const router = useRouter()
    const colors = useThemeColors()
    const [openFAQ, setOpenFAQ] = useState<string | null>(null)

    const leadMember = teamMembers.find((m) => m.lead)
    const otherMembers = teamMembers.filter((m) => !m.lead)

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

                <Text className="text-2xl font-bold text-text">
                    About Burrow
                </Text>
            </View>

            <ScrollView className="flex-1">
                {/* Hero Banner */}
                <View className="px-6 pt-8 pb-6">
                    <View className="bg-gradient-to-br from-primary to-secondary rounded-3xl p-8 items-center">
                        <Image
                            source={{
                                uri: "https://umn.app/image/burrow.png"
                            }}
                            className="w-20 h-20 mb-4 rounded-2xl"
                        />

                        <Text className="text-text text-4xl font-bold mb-2">
                            Burrow
                        </Text>

                        <Text className="text-text text-opacity-90 text-center text-base">
                            Connecting students, one Burrow at a time
                        </Text>

                        <Text className="text-text text-opacity-70 text-sm mt-4">
                            Version{" "}
                            {Application.nativeApplicationVersion ?? "INDEV"}
                        </Text>
                    </View>
                </View>

                <View className="px-6">
                    {/* Team Section */}
                    <Text className="text-text text-xl font-bold mb-4">
                        Meet the Team
                    </Text>

                    {/* Lead Member */}
                    {leadMember && (
                        <Pressable
                            onPress={() => Linking.openURL(leadMember.linkedin)}
                            className="mb-4"
                        >
                            <Card
                                variant="bordered"
                                className="items-center border-secondary border-opacity-30"
                            >
                                <Image
                                    source={{ uri: leadMember.image }}
                                    className="w-24 h-24 rounded-full mb-3"
                                />

                                <Text className="text-text text-lg font-bold">
                                    {leadMember.name}
                                </Text>

                                <Text className="text-text text-opacity-70 text-sm mb-2">
                                    {leadMember.role}
                                </Text>

                                <View className="bg-secondary bg-opacity-20 px-3 py-1 rounded-full flex-row items-center gap-1">
                                    <Text className="text-primary text-xs font-semibold">
                                        Project Lead
                                    </Text>
                                </View>
                            </Card>
                        </Pressable>
                    )}

                    {/* Other Team Members */}
                    <View className="flex-row flex-wrap gap-3 mb-6">
                        {otherMembers.map((member) => (
                            <Pressable
                                key={member.name}
                                onPress={() => Linking.openURL(member.linkedin)}
                                className="flex-1 min-w-[45%]"
                            >
                                <Card
                                    variant="bordered"
                                    className="items-center"
                                >
                                    <Image
                                        source={{ uri: member.image }}
                                        className="w-16 h-16 rounded-full mb-2"
                                    />

                                    <Text className="text-text font-semibold text-sm text-center">
                                        {member.name}
                                    </Text>

                                    <Text className="text-text text-opacity-60 text-xs text-center">
                                        {member.role}
                                    </Text>
                                </Card>
                            </Pressable>
                        ))}
                    </View>

                    {/* Mission */}
                    <Text className="text-text text-xl font-bold mb-4">
                        Our Mission
                    </Text>
                    <Card variant="bordered" className="px-6 mb-6">
                        <Text className="text-text text-opacity-80 leading-relaxed">
                            Burrow is built{" "}
                            <Text className="text-secondary font-semibold">
                                by students at the University of Minnesota
                            </Text>
                            , for students at the University of Minnesota. Our
                            goal is to make studying and connecting with one
                            another easier. Whether that's a group study
                            session, a club meeting, or a social event, Burrow
                            helps keep things organized and collaborative.
                        </Text>
                    </Card>

                    {/* FAQ Section */}
                    <Text className="text-text text-xl font-bold mb-4">
                        Frequently Asked Questions
                    </Text>

                    <View className="space-y-3 gap-3 mb-6">
                        {faqItems.map((item) => {
                            const isOpen = openFAQ === item.id
                            return (
                                <Card
                                    key={item.id}
                                    variant="bordered"
                                    className={isOpen ? "bg-card" : ""}
                                >
                                    <Pressable
                                        onPress={() =>
                                            setOpenFAQ(isOpen ? null : item.id)
                                        }
                                    >
                                        <View className="flex-row items-center justify-between">
                                            <Text className="text-text font-semibold flex-1 pr-3">
                                                {item.question}
                                            </Text>
                                            <ChevronDown
                                                size={20}
                                                color={colors.text}
                                                style={{
                                                    opacity: 0.6,
                                                    transform: [
                                                        {
                                                            rotate: isOpen
                                                                ? "180deg"
                                                                : "0deg"
                                                        }
                                                    ]
                                                }}
                                            />
                                        </View>

                                        {isOpen && (
                                            <Text className="text-text text-opacity-70 text-sm mt-3 leading-relaxed">
                                                {item.answer}
                                            </Text>
                                        )}
                                    </Pressable>
                                </Card>
                            )
                        })}
                    </View>

                    {/* Links */}
                    <Card variant="bordered" className="mb-6">
                        <Pressable
                            onPress={() =>
                                Linking.openURL(
                                    "https://github.com/ajkneisl/burrow"
                                )
                            }
                            className="flex-row items-center justify-between"
                        >
                            <Text className="text-text font-medium">
                                View on GitHub
                            </Text>

                            <ExternalLink size={18} color={colors.primary} />
                        </Pressable>
                    </Card>

                    {/* Footer */}
                    <View className="items-center py-8">
                        <Text className="text-text text-opacity-40 text-xs text-center mt-1">
                            © {new Date().getFullYear()} Burrow Team
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}
