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

            {/* Optional: Due Time
      <CustomDateTimePicker
        label="Due Time (optional)"
        value={formState.dueDate}
        onChange={(time) => {
          // If date already set, update only time
          // Otherwise create new date with time
          if (formState.dueDate) {
            const newDate = new Date(formState.dueDate)
            newDate.setHours(time.getHours())
            newDate.setMinutes(time.getMinutes())
            updateField("dueDate", newDate)
          } else {
            updateField("dueDate", time)
          }
        }}
        mode="time"
        placeholder="Select due time"
      />
      */}

            {/* Helpful hint */}
            <View className="bg-info/10 rounded-lg p-3 mt-2">
                <Text className="text-xs text-text text-opacity-80">
                    💡 Tip: Choose a realistic deadline that gives your team
                    enough time to complete the project.
                </Text>
            </View>

            {/* Bottom spacing */}
            <View className="h-8" />
        </ScrollView>
    )
}
