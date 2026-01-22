import { useState } from "react"
import { View, Text, Pressable } from "react-native"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { Check } from "lucide-react-native"
import { Modal, Button, Input } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"
import { reportUser, type UserReportCategory } from "@features/profile/report.api"
import { blockUser } from "@features/profile/block.api"

const REPORT_CATEGORIES: { id: UserReportCategory; label: string }[] = [
    { id: "Spam", label: "Spam or fake account" },
    { id: "Harassment", label: "Harassment or bullying" },
    { id: "Inappropriate Content", label: "Inappropriate content" },
    { id: "Impersonation", label: "Impersonation" },
    { id: "Other", label: "Other" }
]

type ReportUserModalProps = {
    visible: boolean
    onClose: () => void
    userID: string
    displayName: string
}

export function ReportUserModal({
    visible,
    onClose,
    userID,
    displayName
}: ReportUserModalProps) {
    const colors = useThemeColors()
    const queryClient = useQueryClient()

    const [selectedCategory, setSelectedCategory] =
        useState<UserReportCategory | null>(null)
    const [details, setDetails] = useState("")
    const [alsoBlock, setAlsoBlock] = useState(false)

    const resetState = () => {
        setSelectedCategory(null)
        setDetails("")
        setAlsoBlock(false)
    }

    const handleClose = () => {
        resetState()
        onClose()
    }

    const reportMutation = useMutation({
        mutationFn: async () => {
            if (!selectedCategory) {
                throw new Error("Please select a reason for reporting")
            }

            await reportUser(userID, selectedCategory, details)

            if (alsoBlock) {
                await blockUser(userID)
            }
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["user"] })
            if (alsoBlock) {
                await queryClient.invalidateQueries({ queryKey: ["blockedUsers"] })
            }
            Toast.show({
                type: "success",
                text1: "Report submitted",
                text2: alsoBlock
                    ? `You have also blocked ${displayName}`
                    : "Thank you for your report"
            })
            handleClose()
        },
        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Failed to submit report",
                text2: error.message || "Please try again"
            })
        }
    })

    return (
        <Modal
            visible={visible}
            onClose={handleClose}
            title="Report User"
            centered
        >
            <Text className="text-text mb-4">
                Why are you reporting{" "}
                <Text className="font-bold">{displayName}</Text>?
            </Text>

            {/* Report Category Selection */}
            <View className="mb-4">
                {REPORT_CATEGORIES.map((category) => (
                    <Pressable
                        key={category.id}
                        onPress={() => setSelectedCategory(category.id)}
                        className="flex-row items-center justify-between py-3 px-4 mb-2 rounded-lg bg-card border border-card-border active:opacity-70"
                        style={
                            selectedCategory === category.id
                                ? { borderColor: colors.primary }
                                : undefined
                        }
                    >
                        <Text className="text-text">{category.label}</Text>
                        {selectedCategory === category.id && (
                            <Check size={18} color={colors.primary} />
                        )}
                    </Pressable>
                ))}
            </View>

            {/* Additional Details */}
            <Input
                label="Additional details (optional)"
                placeholder="Provide more context about the issue..."
                value={details}
                onChangeText={setDetails}
                multiline
                numberOfLines={3}
                style={{ minHeight: 80, textAlignVertical: "top" }}
            />

            {/* Also Block Option */}
            <Pressable
                onPress={() => setAlsoBlock(!alsoBlock)}
                className="flex-row items-center justify-between py-3 px-4 mb-6 rounded-lg bg-card border border-card-border"
            >
                <Text className="text-text">Also block this user</Text>
                <View
                    className="w-6 h-6 rounded border-2 items-center justify-center"
                    style={{
                        borderColor: alsoBlock ? colors.primary : colors.text,
                        backgroundColor: alsoBlock ? colors.primary : "transparent"
                    }}
                >
                    {alsoBlock && <Check size={14} color="white" />}
                </View>
            </Pressable>

            {/* Submit Buttons */}
            <View className="flex-row gap-3">
                <Button
                    variant="outline"
                    onPress={handleClose}
                    className="flex-1"
                    disabled={reportMutation.isPending}
                >
                    Cancel
                </Button>
                <Button
                    variant="danger"
                    onPress={() => reportMutation.mutate()}
                    loading={reportMutation.isPending}
                    disabled={!selectedCategory}
                    className="flex-1"
                >
                    Report
                </Button>
            </View>
        </Modal>
    )
}
