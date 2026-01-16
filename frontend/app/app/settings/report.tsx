import {
    View,
    Text,
    ScrollView,
    Pressable,
    KeyboardAvoidingView,
    Platform
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack, usePathname } from "expo-router"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import {
    ArrowLeft,
    AlertCircle,
    Bug,
    FileText,
    Zap,
    Eye,
    HelpCircle,
    Send
} from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import { Card, Button, Input } from "@components/core"
import { submitReport } from "@features/problem/problem.api"
import type { ReportCategory } from "@features/problem/problem.types"
import Toast from "react-native-toast-message"
import * as Application from "expo-application"

/**
 * Report a problem screen.
 *
 * @author AJ Kneisl
 */
export default function ReportProblemScreen() {
    const router = useRouter()
    const pathname = usePathname()
    const colors = useThemeColors()

    const [category, setCategory] = useState<ReportCategory>("Bug")
    const [summary, setSummary] = useState("")
    const [details, setDetails] = useState("")

    const submitMutation = useMutation({
        mutationFn: submitReport,
        onSuccess: () => {
            Toast.show({
                type: "success",
                text1: "Report submitted",
                text2: "Thank you for helping us improve!"
            })
            router.back()
        },
        onError: (error: any) => {
            console.log(error)
            Toast.show({
                type: "error",
                text1: "Failed to submit report",
                text2: error.message || "Please try again"
            })
        }
    })

    const handleSubmit = () => {
        if (!summary.trim()) {
            Toast.show({
                type: "error",
                text1: "Summary required",
                text2: "Please provide a brief summary"
            })
            return
        }

        if (!details.trim()) {
            Toast.show({
                type: "error",
                text1: "Details required",
                text2: "Please describe the problem"
            })
            return
        }

        const userAgent = `${Platform.OS} ${Platform.Version} / App ${Application.nativeApplicationVersion || "Unknown"}`

        submitMutation.mutate({
            summary: summary.trim(),
            details: details.trim(),
            category,
            path: pathname,
            userAgent,
            burrowInfo: ""
        })
    }

    const categories: {
        value: ReportCategory
        label: string
        icon: React.ReactNode
        description: string
    }[] = [
        {
            value: "Bug",
            label: "Bug",
            icon: <Bug size={20} color={colors.error} />,
            description: "Something is not working correctly"
        },
        {
            value: "Content",
            label: "Content",
            icon: <FileText size={20} color={colors.warn} />,
            description: "Inappropriate or problematic content"
        },
        {
            value: "Performance",
            label: "Performance",
            icon: <Zap size={20} color={colors.secondary} />,
            description: "App is slow or unresponsive"
        },
        {
            value: "Accessibility",
            label: "Accessibility",
            icon: <Eye size={20} color={colors.info} />,
            description: "Accessibility or usability issue"
        },
        {
            value: "Other",
            label: "Other",
            icon: <HelpCircle size={20} color={colors.text} />,
            description: "Something else"
        }
    ]

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />

            <View className="px-6 py-4 border-b border-card-border flex-row items-center">
                <Pressable
                    onPress={() => router.back()}
                    className="p-2 mr-2 -ml-2"
                >
                    <ArrowLeft size={24} color={colors.text} />
                </Pressable>
                <View className="flex-1">
                    <Text className="text-2xl font-bold text-text">
                        Report a Problem
                    </Text>
                    <Text className="text-sm text-text text-opacity-60 mt-0.5">
                        Help us improve Burrow
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    className="flex-1 px-6 py-4"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Card variant="bordered" className="bg-opacity-5 mb-6">
                        <View className="flex-row items-start gap-3">
                            <AlertCircle size={20} color={colors.info} />
                            <View className="flex-1">
                                <Text className="text-text font-semibold mb-1">
                                    We are here to help
                                </Text>
                                <Text className="text-text text-opacity-60 text-sm">
                                    Report bugs, content issues, or provide
                                    feedback. We will review your report and get
                                    back to you.
                                </Text>
                            </View>
                        </View>
                    </Card>

                    <Text className="text-text font-semibold mb-3">
                        What type of problem?
                    </Text>

                    <View className="gap-2 mb-6">
                        {categories.map((cat) => (
                            <Pressable
                                key={cat.value}
                                onPress={() => setCategory(cat.value)}
                                className={`flex-row items-center p-4 rounded-lg border ${
                                    category === cat.value
                                        ? "bg-primary bg-opacity-10 border-primary"
                                        : "bg-card border-card-border"
                                }`}
                            >
                                <View className="mr-3">{cat.icon}</View>
                                <View className="flex-1">
                                    <Text
                                        className={`font-semibold mb-0.5 ${category === cat.value ? "text-white" : "text-text"}`}
                                    >
                                        {cat.label}
                                    </Text>

                                    <Text
                                        className={
                                            `text-text text-opacity-60 text-xs ${category === cat.value ? "text-white" : "text-text"}`
                                        }
                                    >
                                        {cat.description}
                                    </Text>
                                </View>
                            </Pressable>
                        ))}
                    </View>

                    <Input
                        label="Summary *"
                        value={summary}
                        onChangeText={setSummary}
                        placeholder="e.g., Cannot join burrow"
                        helperText="Brief description of the problem"
                        maxLength={100}
                    />

                    <Input
                        label="Details *"
                        value={details}
                        onChangeText={setDetails}
                        placeholder="Describe the problem in detail..."
                        helperText="What were you doing when the problem occurred?"
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        style={{ minHeight: 120 }}
                    />

                    <Card variant="bordered" className="bg-card mb-6">
                        <Text className="text-text text-opacity-60 text-xs">
                            <Text className="font-semibold">Note:</Text> We
                            automatically collect device info, app version, and
                            current screen to help diagnose the issue.
                        </Text>
                    </Card>

                    <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        onPress={handleSubmit}
                        loading={submitMutation.isPending}
                        leftIcon={<Send size={20} color="#FFFFFF" />}
                        disabled={!summary.trim() || !details.trim()}
                    >
                        Submit Report
                    </Button>

                    <View className="h-32" />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}