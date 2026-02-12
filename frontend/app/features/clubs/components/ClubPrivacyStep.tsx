import { Pressable, ScrollView, Switch, Text, View } from "react-native"
import { ClubStepProps, CLUB_PRIVACY_OPTIONS } from "@features/clubs/club.types"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * The step of the club creation process about privacy.
 *
 * @author AJ Kneisl
 */
export default function ClubPrivacyStep({
    updateField,
    formState
}: ClubStepProps) {
    const colors = useThemeColors()

    return (
        <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
        >
            {/* Info Card */}
            <View className="bg-card rounded-lg border border-card-border p-4 mb-6">
                <Text className="text-text text-sm font-semibold mb-2">
                    Privacy Settings
                </Text>
                <Text className="text-text text-opacity-60 text-xs">
                    Control who can see and join your club. You can change these
                    settings later.
                </Text>
            </View>

            {/* Privacy Options */}
            <View className="mb-6">
                <Text className="text-base font-semibold text-text mb-3">
                    Club Privacy
                </Text>

                {CLUB_PRIVACY_OPTIONS.map((option) => {
                    const Icon = option.icon
                    const isSelected = formState.privacy === option.value

                    return (
                        <Pressable
                            key={option.value}
                            onPress={() => updateField("privacy", option.value)}
                            style={{
                                backgroundColor: isSelected
                                    ? `${colors.primary}2A`
                                    : colors.background
                            }}
                            className={`flex-row items-center p-4 mb-3 rounded-lg border ${
                                isSelected
                                    ? "border-primary"
                                    : "border-card-border"
                            }`}
                        >
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

            {/* Require Approval */}
            <View className="border-t border-gray-200 pt-6">
                <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-4">
                        <Text className="text-base font-semibold text-text mb-1">
                            Require approval to join
                        </Text>
                        <Text className="text-sm text-text text-opacity-60">
                            Users must request to join and wait for approval
                            from an administrator or moderator
                        </Text>
                    </View>

                    <Switch
                        value={formState.requestToJoin}
                        onValueChange={(value) =>
                            updateField("requestToJoin", value)
                        }
                        trackColor={{
                            false: "#D1D5DB",
                            true: "#7A0019"
                        }}
                        thumbColor="#FFFFFF"
                    />
                </View>
            </View>

            <View className="h-8" />
        </ScrollView>
    )
}
