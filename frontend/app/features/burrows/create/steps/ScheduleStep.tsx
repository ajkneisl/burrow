import { View, Text, ScrollView } from "react-native"
import { CustomDateTimePicker } from "@components/core"
import type { CreateStepProps } from "../create.types"

/**
 * The schedule section of a Burrow.
 *
 * @param errors Errors with fields.
 * @param formState Current state of form.
 * @param updateField When a field is updated.
 *
 * @author AJ Kneisl
 */
export function ScheduleStep({
    errors,
    formState,
    updateField
}: CreateStepProps) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return (
        <ScrollView className="flex-1 px-6">
            {/* info */}
            <View className="bg-card rounded-lg border border-card-border p-4 mb-6">
                <Text className="text-text text-sm font-semibold mb-2">
                    Schedule Your Session
                </Text>

                <Text className="text-text text-opacity-60 text-xs">
                    Pick a date and time for your Burrow. Make sure to choose a
                    time that works for your schedule.
                </Text>
            </View>

            {/* date picker */}
            <CustomDateTimePicker
                label="Date *"
                value={formState.date}
                onChange={(date) => updateField("date", date)}
                mode="date"
                error={errors.date}
                minimumDate={today}
                placeholder="Select date"
            />

            {/* beginning time */}
            <CustomDateTimePicker
                label="Start Time *"
                value={formState.beginningTime}
                onChange={(time) => updateField("beginningTime", time)}
                mode="time"
                error={errors.beginningTime}
                placeholder="Select start time"
            />

            {/* end time */}
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
