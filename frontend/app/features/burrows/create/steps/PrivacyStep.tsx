import { View, ScrollView, Pressable, Switch } from "react-native"
import { Text } from "@components/core"
import { Globe, Link2, Lock } from "lucide-react-native"
import type { CreateStepProps } from "../create.types"
import type { BurrowVisibility } from "@features/burrows/burrows.types"
import { useThemeColors } from "@api/theme/useThemeColors"

// the visibility options
const VISIBILITY_OPTIONS: {
    value: BurrowVisibility
    label: string
    description: string
    icon: typeof Globe
}[] = [
    {
        value: "PUBLIC",
        label: "Public",
        description: "Visible to everyone on Burrow",
        icon: Globe
    },
    {
        value: "UNLISTED",
        label: "Unlisted",
        description: "Only accessible via link",
        icon: Link2
    },
    {
        value: "PRIVATE",
        label: "Private",
        description: "Invite-only, not searchable",
        icon: Lock
    }
]

/**
 * The privacy step of a Burrow.
 *
 * @param formState State of form.
 * @param updateField When a field is updated
 *
 * @author AJ Kneisl
 */
export function PrivacyStep({ formState, updateField }: CreateStepProps) {
    const colors = useThemeColors()

    return (
        <ScrollView className="flex-1 px-6">
            {/* visibility */}
            <View className="mb-6">
                <Text className="text-base font-semibold text-text mb-3">
                    Visibility
                </Text>

                {VISIBILITY_OPTIONS.map((option) => {
                    const Icon = option.icon
                    const isSelected = formState.visibility === option.value

                    return (
                        <Pressable
                            key={option.value}
                            onPress={() =>
                                updateField("visibility", option.value)
                            }
                            style={{
                                backgroundColor: isSelected
                                    ? `${colors.primary}2A`
                                    : colors.background
                            }}
                            className={`flex-row transition-all duration-300 items-center p-4 mb-3 rounded-lg border ${
                                isSelected
                                    ? "border-primary"
                                    : "border-card-border"
                            }`}
                        >
                            {/* Icon */}
                            <View
                                className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                                    isSelected ? "bg-primary" : "bg-card"
                                }`}
                            >
                                <Icon
                                    size={20}
                                    color={isSelected ? "#FFFFFF" : "#6B7280"}
                                />
                            </View>

                            {/* text */}
                            <View className="flex-1">
                                <Text
                                    className={`text-base font-semibold ${
                                        isSelected
                                            ? "text-primary"
                                            : "text-text"
                                    }`}
                                >
                                    {option.label}
                                </Text>

                                <Text className="text-sm text-text text-opacity-60">
                                    {option.description}
                                </Text>
                            </View>

                            {/* radio */}
                            <View
                                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                                    isSelected
                                        ? "border-primary"
                                        : "border-card-border"
                                }`}
                            >
                                {isSelected && (
                                    <View className="w-3 h-3 rounded-full bg-primary" />
                                )}
                            </View>
                        </Pressable>
                    )
                })}
            </View>

            {/* request to join */}
            <View className="border-t border-gray-200 pt-6">
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-4">
                        <Text className="text-base font-semibold text-text mb-1">
                            Require approval to join
                        </Text>

                        <Text className="text-sm text-text text-opacity-60">
                            Users must request to join and wait for approval
                            from a host or moderator
                        </Text>
                    </View>

                    <Switch
                        value={formState.requestToJoin}
                        onValueChange={(value) =>
                            updateField("requestToJoin", value)
                        }
                        trackColor={{ false: "#D1D5DB", true: "#7A0019" }}
                        thumbColor="#FFFFFF"
                    />
                </View>
            </View>

            {/* Bottom spacing */}
            <View className="h-8" />
        </ScrollView>
    )
}
