import { useState } from "react"
import { View, Text, Pressable, Platform } from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Calendar, Clock } from "lucide-react-native"

type DateTimePickerProps = {
    label?: string
    value: Date | null
    onChange: (date: Date) => void
    mode: "date" | "time"
    error?: string
    minimumDate?: Date
    maximumDate?: Date
    placeholder?: string
}

export function CustomDateTimePicker({
    label,
    value,
    onChange,
    mode,
    error,
    minimumDate,
    maximumDate,
    placeholder
}: DateTimePickerProps) {
    const [show, setShow] = useState(false)

    const handleChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === "android") {
            setShow(false)
        }

        if (event.type === "set" && selectedDate) {
            onChange(selectedDate)
        }
    }

    const formatValue = () => {
        if (!value)
            return (
                placeholder || (mode === "date" ? "Select date" : "Select time")
            )

        if (mode === "date") {
            return value.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric"
            })
        } else {
            return value.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit"
            })
        }
    }

    const Icon = mode === "date" ? Calendar : Clock
    const iconColor = error ? "#EF4444" : "#7A0019"

    return (
        <View className="mb-4">
            {label && (
                <Text className="text-sm font-semibold text-text mb-2">
                    {label}
                </Text>
            )}

            <Pressable
                onPress={() => setShow(true)}
                className={`flex-row items-center justify-between px-4 py-3 rounded-lg border ${
                    error
                        ? "border-error"
                        : "border-card-border dark:border-card-border"
                } bg-background dark:bg-background`}
            >
                <Text
                    className={`text-base ${value ? "text-text dark:text-text" : "text-text dark:text-text opacity-50"}`}
                >
                    {formatValue()}
                </Text>
                <Icon size={20} color={iconColor} />
            </Pressable>

            {error && <Text className="text-sm text-error mt-1">{error}</Text>}

            {show && (
                <DateTimePicker
                    value={value || new Date()}
                    mode={mode}
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleChange}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                    {...(Platform.OS === "ios" && {
                        onTouchCancel: () => setShow(false)
                    })}
                />
            )}

            {/* iOS needs a modal overlay with Done button */}
            {Platform.OS === "ios" && show && (
                <View className="absolute bottom-0 left-0 right-0 bg-background dark:bg-background border-t border-card-border dark:border-card-border p-4">
                    <Pressable
                        onPress={() => setShow(false)}
                        className="bg-primary py-2 px-4 rounded-lg"
                    >
                        <Text className="text-white text-center font-semibold">
                            Done
                        </Text>
                    </Pressable>
                </View>
            )}
        </View>
    )
}
