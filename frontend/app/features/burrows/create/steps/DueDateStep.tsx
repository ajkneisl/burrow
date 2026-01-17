import { View, Text, ScrollView } from "react-native"
import { CustomDateTimePicker } from "@components/core"
import type { CreateStepProps } from "../create.types"

export function DueDateStep({
    errors,
    formState,
    updateField
}: CreateStepProps) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return (
        <ScrollView className="flex-1 px-6">
            {/* Info Card */}
            <View className="bg-primary/10 rounded-lg border border-primary/20 p-4 mb-6">
                <Text className="text-text text-sm font-semibold mb-2">
                    Project Due Date
                </Text>
                <Text className="text-text text-opacity-60 text-xs">
                    Set when this project is due. This helps keep your team on
                    track and organized.
                </Text>
            </View>

            {/* Due Date Picker */}
            <CustomDateTimePicker
                label="Due Date *"
                value={formState.dueDate}
                onChange={(date) => updateField("dueDate", date)}
                mode="date"
                error={errors.dueDate}
                minimumDate={today}
                placeholder="Select due date"
            />

            {/* Bottom spacing */}
            <View className="h-8" />
        </ScrollView>
    )
}
