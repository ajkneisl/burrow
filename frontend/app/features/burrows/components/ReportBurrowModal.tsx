import { useState } from "react"
import { View, Text, Pressable } from "react-native"
import { useMutation } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { Check } from "lucide-react-native"
import { Modal, Button, Input } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"
import { reportBurrow } from "@features/profile/profile.api"
import type { BurrowReportCategory } from "@features/profile/profile.types"

const REPORT_CATEGORIES: BurrowReportCategory[] = [
    "Spam",
    "Inappropriate Content",
    "Misleading Information",
    "Harassment",
    "Other"
]

/**
 * {@link ReportBurrowModal}
 */
type ReportBurrowModalProps = {
    visible: boolean
    onClose: () => void
    burrowID: string
    burrowTitle: string
}

/**
 * A modal to report a burrow.
 *
 * @param visible If the modal is visible.
 * @param onClose When the modal is closed.
 * @param burrowID The burrow ID to report.
 * @param burrowTitle The title of the burrow.
 */
export function ReportBurrowModal({
    visible,
    onClose,
    burrowID,
    burrowTitle
}: ReportBurrowModalProps) {
    const colors = useThemeColors()

    const [selectedCategory, setSelectedCategory] =
        useState<BurrowReportCategory | null>(null)
    const [details, setDetails] = useState("")

    const resetState = () => {
        setSelectedCategory(null)
        setDetails("")
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

            await reportBurrow(burrowID, selectedCategory, details)
        },
        onSuccess: () => {
            Toast.show({
                type: "success",
                text1: "Report submitted",
                text2: "Thank you for your report"
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
            title="Report Burrow"
            centered
        >
            <Text className="text-text mb-4">
                Why are you reporting{" "}
                <Text className="font-bold">{burrowTitle}</Text>?
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

            <View className="h-6" />

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