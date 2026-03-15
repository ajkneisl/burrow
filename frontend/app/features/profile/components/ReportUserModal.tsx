import { useState } from "react"
import { View, Pressable } from "react-native"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { Check } from "lucide-react-native"
import { Modal, Button, Input, Text } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"
import { reportUser, blockUser } from "@features/profile/profile.api"
import type {
    BurrowReportCategory,
    UserReportCategory
} from "@features/profile/profile.types"

const REPORT_CATEGORIES: UserReportCategory[] = [
    "Spam",
    "Harassment",
    "Inappropriate Content",
    "Impersonation",
    "Other"
]

/**
 * {@link ReportUserModal}
 */
type ReportUserModalProps = {
    visible: boolean
    onClose: () => void
    userID: string
    displayName: string
}

/**
 * A modal to report a user.
 *
 * @param visible If the modal is visible.
 * @param onClose When the modal is closed.
 * @param userID The user ID to report
 * @param displayName The display name of the user.
 */
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
                await queryClient.invalidateQueries({
                    queryKey: ["blockedUsers"]
                })
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
                        key={category}
                        onPress={() => setSelectedCategory(category)}
                        className="flex-row items-center justify-between py-3 px-4 mb-2 rounded-lg bg-card border border-card-border active:opacity-70"
                        style={
                            selectedCategory === category
                                ? { borderColor: colors.primary }
                                : undefined
                        }
                    >
                        <Text className="text-text">{category}</Text>
                        {selectedCategory === category && (
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
                        backgroundColor: alsoBlock
                            ? colors.primary
                            : "transparent"
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
