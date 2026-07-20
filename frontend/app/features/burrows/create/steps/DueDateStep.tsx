import { View, ScrollView } from "react-native"
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
