import { DAILY, MONTHLY, NOT_REOCCURRING, WEEKLY } from "@umnburrow/core/api"
import { View, ScrollView, Pressable } from "react-native"
import { CustomDateTimePicker, LabeledSwitch, Text } from "@components/core"
import type { CreateStepProps } from "../create.types"
import { useState } from "react"

import { useThemeColors } from "@api/theme/useThemeColors"

type Timeframe = "Daily" | "Weekly" | "Monthly"

const TIMEFRAME_OPTIONS: Timeframe[] = ["Daily", "Weekly", "Monthly"]

function timeframeToValue(tf: Timeframe): number {
    switch (tf) {
        case "Daily":
            return DAILY
        case "Weekly":
            return WEEKLY
        case "Monthly":
            return MONTHLY
    }
}

function valueToTimeframe(val: number): Timeframe {
    switch (val) {
        case DAILY:
            return "Daily"
        case MONTHLY:
            return "Monthly"
        default:
            return "Weekly"
    }
}

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

    const colors = useThemeColors()
    const [reoccurring, setReoccurring] = useState(
        formState.reoccurring !== NOT_REOCCURRING
    )
    const [timeframe, setTimeframe] = useState<Timeframe>(
        formState.reoccurring !== NOT_REOCCURRING
            ? valueToTimeframe(formState.reoccurring)
            : "Weekly"
    )

    return (
        <ScrollView className="flex-1 px-6">
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

            {/* reoccurring toggle */}
            <View className="mt-4">
                <LabeledSwitch
                    label="Reoccurring Burrow"
                    value={reoccurring}
                    onValueChange={(enabled) => {
                        setReoccurring(enabled)
                        if (enabled) {
                            updateField("reoccurring", timeframeToValue(timeframe))
                        } else {
                            updateField("reoccurring", NOT_REOCCURRING)
                        }
                    }}
                />
            </View>

            {/* frequency selector */}
            {reoccurring && (
                <View className="mt-4">
                    <Text className="text-text text-xs uppercase tracking-wide mb-2 opacity-60">
                        How Often?
                    </Text>

                    <View className="flex-row gap-2">
                        {TIMEFRAME_OPTIONS.map((option) => (
                            <Pressable
                                key={option}
                                onPress={() => {
                                    setTimeframe(option)
                                    updateField("reoccurring", timeframeToValue(option))
                                }}
                                className="flex-1 rounded-lg border py-2.5 items-center"
                                style={{
                                    borderColor:
                                        timeframe === option
                                            ? colors.primary
                                            : colors.cardBorder,
                                    backgroundColor:
                                        timeframe === option
                                            ? `${colors.primary}15`
                                            : colors.card
                                }}
                            >
                                <Text
                                    className="text-sm font-medium"
                                    style={{
                                        color:
                                            timeframe === option
                                                ? colors.primary
                                                : colors.text
                                    }}
                                >
                                    {option}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            )}

            {/* Bottom spacing */}
            <View className="h-8" />
        </ScrollView>
    )
}