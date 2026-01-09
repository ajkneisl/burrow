import { View, Text, ScrollView } from "react-native"
import { CustomDateTimePicker } from "@components/core"
import type { CreateStepProps } from "../create.types"

export function ScheduleStep({
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
                    Schedule Your Session
                </Text>
                <Text className="text-text text-opacity-60 text-xs">
                    Pick a date and time for your burrow. Make sure to choose a
                    time that works for your schedule.
                </Text>
            </View>

            {/* Date Picker */}
            <CustomDateTimePicker
                label="Date *"
                value={formState.date}
                onChange={(date) => updateField("date", date)}
                mode="date"
                error={errors.date}
                minimumDate={today}
                placeholder="Select date"
            />

            {/* Beginning Time Picker */}
            <CustomDateTimePicker
                label="Start Time *"
                value={formState.beginningTime}
                onChange={(time) => updateField("beginningTime", time)}
                mode="time"
                error={errors.beginningTime}
                placeholder="Select start time"
            />

            {/* End Time Picker */}
            <CustomDateTimePicker
                label="End Time *"
                value={formState.endTime}
                onChange={(time) => updateField("endTime", time)}
                mode="time"
                error={errors.endTime}
                placeholder="Select end time"
            />

            {/* Bottom spacing */}
            <View className="h-8" />
        </ScrollView>
    )
}
