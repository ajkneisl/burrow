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

            {/* Helpful hint */}
            <View className="bg-info/10 rounded-lg p-3 mt-2">
                <Text className="text-xs text-text text-opacity-80">
                    💡 Tip: The start and end times must be on the same day. For
                    multi-day events, create separate burrows.
                </Text>
            </View>

            {/* Bottom spacing */}
            <View className="h-8" />
        </ScrollView>
    )
}
